import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { OrderStatus, PaymentStatus, User } from '@prisma/client';
import { OrderSearchDto } from './dto/order-search.dto';

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

        // 2. Fetch or create address for snapshotting
        let address;
        if (createOrderDto.addressId) {
          address = await tx.address.findUnique({
            where: { id: createOrderDto.addressId },
          });

          if (!address || address.userId !== userId) {
            throw new BadRequestException({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Selected address is invalid or does not belong to this user.',
            });
          }
        } else if (createOrderDto.newAddress) {
          // Create the new address and link it to the user
          // This allows "ordering for others" while keeping the address in the user's history
          address = await tx.address.create({
            data: {
              ...createOrderDto.newAddress,
              userId,
            },
          });
        } else {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Please provide either an existing address or a new delivery address.',
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

        // 5. Create the Order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            totalAmount,
            branchId: createOrderDto.branchId,
            shippingAddress: address as any, // Snapshotting the full address object
            couponId: createOrderDto.couponId,
            notes: createOrderDto.notes,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: true,
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

        // 7. Clear the cart items and deactivate the cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: { isActive: false },
        });

        return order;
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

  async getOrderById(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }
    return await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        payments: true,
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
          },
        },
      },
    });
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
            items: isStaff, // Only include full items list for staff in the bulk list
            payments: isStaff,
            user: isStaff
              ? {
                select: {
                  firstname: true,
                  lastname: true,
                  email: true,
                  phone: true,
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
        results: orders,
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
}
