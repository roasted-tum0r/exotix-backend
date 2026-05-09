import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { ImageOwnerType, OrderStatus, PaymentStatus, User } from '@prisma/client';
import { OrderSearchDto } from './dto/order-search.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createOrderFromCart(userId: string, createOrderDto: CreateOrderDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Fetch active cart with items
        const cart = await tx.cart.findUnique({
          where: { userId_isActive: { userId, isActive: true } },
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Your cart is empty. Please add items before checking out.',
          });
        }

        // 2. Fetch address for snapshotting
        if (!createOrderDto.addressId) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Please provide a delivery address ID.',
          });
        }

        const address = await tx.address.findUnique({
          where: { id: createOrderDto.addressId },
        });

        if (!address || address.userId !== userId) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Selected address is invalid or does not belong to this user.',
          });
        }

        // 3. Calculate totals and prepare item snapshots
        let totalAmount = 0;
        const orderItemsData = cart.items.map((cartItem) => {
          const itemPrice = cartItem.item.price;
          totalAmount += itemPrice * cartItem.quantity;
          return {
            itemId: cartItem.itemId,
            quantity: cartItem.quantity,
            priceAtPurchase: itemPrice,
            itemName: cartItem.item.name,
            itemThumbnail: cartItem.item.image,
          };
        });

        // 4. Generate a unique human-readable order number
        const orderNumber = `EX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Resolve contact number snapshot (DTO > Address Phone > User Account Phone)
        const userAccount = await tx.user.findUnique({
          where: { id: userId },
          select: { phone: true },
        });
        const resolvedContactNumber =
          createOrderDto.contactNumber ||
          (address as any)?.phone ||
          userAccount?.phone ||
          null;

        // 5. Create the Order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            totalAmount,
            branchId: createOrderDto.branchId,
            shippingAddress: address as any, // Snapshotting the full address object
            contactNumber: resolvedContactNumber,
            couponId: createOrderDto.couponId,
            notes: createOrderDto.notes,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: {
              include: {
                item: {
                  include: {
                    images: {
                      where: {
                        ownerType: ImageOwnerType.ITEM_THUMBNAIL,
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                phone: true,
                images: {
                  select: { imageUrl: true },
                  where: { ownerType: ImageOwnerType.USER },
                  take: 1,
                },
              },
            },
          },
        });

        // 6. Create initial Payment entry
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: totalAmount,
            provider: createOrderDto.paymentMethod,
            status: PaymentStatus.PENDING,
          },
        });

        // 7. Clear the cart items (keeps the cart record alive and active)
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return this.transformOrder(order);
      });
    } catch (error: any) {
      AppLogger.error(`Checkout failed for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Order processing failed. Please try again.',
      });
    }
  }

  async getOrderById(orderId: string, userId?: string, isStaff = false) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }
    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            item: {
              include: {
                images: {
                  where: {
                    ownerType: ImageOwnerType.ITEM_THUMBNAIL,
                  },
                },
              },
            },
          },
        },
        payments: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
            images: {
              select: { imageUrl: true },
              where: { ownerType: ImageOwnerType.USER },
              take: 1,
            },
          },
        },
      },
    });
    return this.transformOrder(order, isStaff);
  }

  async findAllOrders(searchDto: OrderSearchDto, user: User) {
    try {
      const {
        searchText,
        page,
        limit,
        status,
        paymentStatus,
        branchId,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy,
        isAsc,
      } = searchDto;
      const skip = (page - 1) * limit;

      const isStaff =
        user.role === 'ADMIN' ||
        user.role === 'EMPLOYEE' ||
        user.role === 'MANAGER';

      const where: any = {};

      // 🔒 Security: Customers can ONLY see their own orders
      if (!isStaff) {
        where.userId = user.id;
      }

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (branchId) {
        where.branchId = branchId;
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        where.totalAmount = {};
        if (minAmount !== undefined) where.totalAmount.gte = minAmount;
        if (maxAmount !== undefined) where.totalAmount.lte = maxAmount;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (searchText) {
        const searchConditions: any[] = [
          { orderNumber: { contains: searchText } },
        ];

        // Only staff can search by user metadata across all orders
        if (isStaff) {
          searchConditions.push(
            { user: { firstname: { contains: searchText } } },
            { user: { lastname: { contains: searchText } } },
            { user: { email: { contains: searchText } } },
            { user: { phone: { contains: searchText } } },
          );
        }

        where.OR = searchConditions;
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy || 'createdAt']: isAsc ? 'asc' : 'desc' },
          include: {
            _count: { select: { items: true } },
            items: {
              include: {
                item: {
                  include: {
                    images: {
                      where: {
                        ownerType: ImageOwnerType.ITEM_THUMBNAIL,
                      },
                    },
                  },
                },
              },
            },
            payments: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            user: isStaff
              ? {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                  phone: true,
                  images: {
                    select: { imageUrl: true },
                    where: { ownerType: ImageOwnerType.USER },
                    take: 1,
                  },
                },
              }
              : false,
          },
        }),
        this.prisma.order.count({ where }),
      ]);
      return {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        results: orders.map((order) => this.transformOrder(order)),
      };
    } catch (error) {
      AppLogger.error('Repository findAllOrders failed', error.stack);
      throw error;
    }
  }


  async confirmPayment(orderId: string, transactionId?: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new BadRequestException('Order not found');

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          transactionId: transactionId || `MANUAL-${Date.now()}`,
        },
      });

      return { message: 'Order confirmed successfully' };
    });
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, user: User) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Valid Transitions Map
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.RETURNED]: [],
      };

      if (!validTransitions[order.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition order from ${order.status} to ${dto.status}`,
        );
      }

      // Perform side-effects based on target status
      if (dto.status === OrderStatus.CANCELLED || dto.status === OrderStatus.RETURNED) {
        // TODO: Implement inventory restoration when inventory module is complete
        // Example:
        // for (const item of order.items) {
        //   await tx.inventory.update({
        //     where: { itemId_branchId: ... },
        //     data: { quantity: { increment: item.quantity } }
        //   });
        // }
      }

      if (dto.status === OrderStatus.PROCESSING && order.status === OrderStatus.CONFIRMED) {
        // TODO: Implement inventory deduction when inventory module is complete
      }

      // If status is being updated to CONFIRMED, we need to handle payment status as well
      if (dto.status === OrderStatus.CONFIRMED) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });

        await tx.payment.updateMany({
          where: { orderId },
          data: {
            status: PaymentStatus.PAID,
            transactionId: dto.transactionId || `MANUAL-${Date.now()}`,
          },
        });
      }

      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status,
          notes: dto.notes ?? order.notes,
          // We can append tracking info to notes if provided, or if there is a specific field
          ...(dto.trackingNumber ? { notes: `${order.notes || ''}\nTracking: ${dto.trackingNumber}` } : {}),
        },
      });

      return this.transformOrder(updatedOrder, true);
    });
  }

  private transformOrder(order: any, isStaff: boolean = false) {
    if (!order) return order;

    // Convert Decimal fields to Numbers for clean JSON serialization
    if (order.totalAmount) {
      order.totalAmount = Number(order.totalAmount);
    }

    if (order.items) {
      order.items = order.items.map((item: any) => {
        const transformedItem: any = {
          ...item,
          priceAtPurchase: item.priceAtPurchase
            ? Number(item.priceAtPurchase)
            : item.priceAtPurchase,
        };

        if (item.item && item.item.images) {
          transformedItem.thumbnail =
            item.item.images.find(
              (img: any) => img.ownerType === ImageOwnerType.ITEM_THUMBNAIL,
            ) || null;
        }

        // Remove the nested item object to keep the response clean
        delete transformedItem.item;

        if (!isStaff) {
          // Hide internal IDs for users
          delete transformedItem.id;
          delete transformedItem.orderId;
        }

        return transformedItem;
      });
    }

    if (order.payments) {
      order.payments = order.payments.map((payment: any) => {
        const transformedPayment: any = {
          ...payment,
          amount: payment.amount ? Number(payment.amount) : payment.amount,
        };

        if (!isStaff) {
          // Hide sensitive payment fields for users
          delete transformedPayment.id;
          delete transformedPayment.orderId;
          delete transformedPayment.paymentMetadata;
          delete transformedPayment.updatedAt;
        }

        return transformedPayment;
      });
    }

    if (!isStaff) {
      // Hide sensitive order fields for users
      delete order.userId;
      delete order.branchId;
      delete order.couponId;
      delete order.updatedAt;
      delete order.branch;
    }

    // Resolve contact number (Snapshot > Address Phone > User Account Phone)
    const address = order.shippingAddress as any;
    const userPhone = order.user?.phone;
    order.contactNumber = order.contactNumber || address?.phone || userPhone || 'Not Provided';

    // Format user info for admin/staff
    if (isStaff && order.user) {
      const userImages = order.user.images || [];
      order.user = {
        id: order.user.id,
        name: `${order.user.firstname} ${order.user.lastname || ''}`.trim(),
        email: order.user.email,
        phone: order.user.phone,
        image: userImages[0]?.imageUrl || null,
      };
    }

    return order;
  }
}
