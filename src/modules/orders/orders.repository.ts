import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { ImageOwnerType, OrderStatus, PaymentStatus, User } from '@prisma/client';
import { OrderSearchDto } from './dto/order-search.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { MailService } from 'src/services/mail/mailservice.service';
import { Templates } from 'src/config/templates/template';
import { ConfigService } from '@nestjs/config';
import { RazorpayService } from 'src/services/razorpay/razorpay.service';
import { RedisService } from 'src/services/redis/redis.service';

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly razorpayService: RazorpayService,
    private readonly redisService: RedisService,
  ) { }

  /**
   * Centralized logic for price breakdown
   * Subtotal = items price * quantity
   * GST = 18%
   * Delivery = ₹50, free if subtotal > ₹1000
   */
  calculateOrderTotals(itemsPrice: number) {
    const subtotal = itemsPrice;
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const deliveryFee = subtotal > 1000 ? 0 : 500;
    const totalAmount = subtotal + gstAmount + deliveryFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

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
        let subtotal = 0;
        const orderItemsData = cart.items.map((cartItem) => {
          const itemPrice = cartItem.item.price;
          subtotal += itemPrice * cartItem.quantity;
          return {
            itemId: cartItem.itemId,
            quantity: cartItem.quantity,
            priceAtPurchase: itemPrice,
            itemName: cartItem.item.name,
            itemThumbnail: cartItem.item.image,
          };
        });

        const totals = this.calculateOrderTotals(subtotal);

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
            subtotal: totals.subtotal,
            gstAmount: totals.gstAmount,
            deliveryFee: totals.deliveryFee,
            totalAmount: totals.totalAmount,
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
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: totals.totalAmount,
            provider: createOrderDto.paymentMethod,
            status: PaymentStatus.PENDING,
          },
        });

        // 7. Clear the cart items (keeps the cart record alive and active)
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        const result = this.transformOrder(order);

        // 8. Razorpay Order Integration
        if (createOrderDto.paymentMethod === 'ONLINE') {
          try {
            const rzpOrder = await this.razorpayService.createOrder(totals.totalAmount, order.orderNumber);
            result.razorpayOrderId = rzpOrder.id;
            result.razorpayKey = this.configService.get<string>('RAZORPAY_KEY_ID');
            
            // Update payment with razorpay order id in metadata
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                paymentMetadata: {
                  razorpayOrderId: rzpOrder.id,
                } as any,
              },
            });

            // Set a 10-minute expiry in Redis to track pending online payments
            await this.redisService.set(
              `order_expiry:${order.id}`,
              'pending',
              600, // 10 minutes
            );

            // Set a 24-hour hard deadline in Redis to prevent infinite retries
            await this.redisService.set(
              `order_hard_deadline:${order.id}`,
              'active',
              86400, // 24 hours (24 * 60 * 60)
            );
          } catch (error) {
            AppLogger.error(`Razorpay order creation failed for order ${order.id}`, error.stack);
            throw new BadRequestException('Failed to initiate online payment. Please try again.');
          }
        }

        // Fire email (non-blocking)
        this.sendOrderStatusEmail(order.id, OrderStatus.PENDING).catch(e => AppLogger.error(`Email failed: ${e.message}`));
        return result;
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

    if (!order) return null;

    // Passive Cancellation: If order is PENDING and ONLINE, but hard deadline is gone
    const isOnline = order.payments?.some(p => p.provider === 'ONLINE');
    if (order.status === OrderStatus.PENDING && isOnline) {
      const deadline = await this.redisService.get(`order_hard_deadline:${order.id}`);
      if (!deadline) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            notes: order.notes ? `${order.notes}\nPayment window expired (24h limit reached).` : 'Payment window expired (24h limit reached).',
          },
        });
        order.status = OrderStatus.CANCELLED;
        // Notify user via email (passive)
        this.sendOrderStatusEmail(order.id, OrderStatus.CANCELLED).catch(e => AppLogger.error(`Passive cancellation email failed: ${e.message}`));
      }
    }

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

      // Fire email (non-blocking)
      this.sendOrderStatusEmail(orderId, OrderStatus.CONFIRMED).catch(e => AppLogger.error(`Email failed: ${e.message}`));

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { item: { include: { images: true } } } },
          payments: true,
          user: true,
        },
      });

      return this.transformOrder(updatedOrder);
    });
  }

  async verifyRazorpayPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
  ) {
    // 1. Verify Signature
    const isValid = this.razorpayService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. Fetch order and check ownership
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order || order.userId !== userId) {
        throw new BadRequestException('Order not found or access denied');
      }

      // 3. Update Order and Payment status
      // User said: payment status to done (PAID) and order to processing
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PROCESSING,
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          transactionId: razorpayPaymentId,
          paymentMetadata: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          } as any,
        },
      });

      // 3.5 Remove the expiry timers from Redis as payment is now successful
      await this.redisService.deleteKey(`order_expiry:${orderId}`);
      await this.redisService.deleteKey(`order_hard_deadline:${orderId}`);

      // 4. Fire email
      this.sendOrderStatusEmail(orderId, OrderStatus.PROCESSING).catch((e) =>
        AppLogger.error(`Email failed: ${e.message}`),
      );

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { item: { include: { images: true } } } },
          payments: true,
          user: true,
        },
      });

      return this.transformOrder(updatedOrder);
    });
  }

  async handlePaymentFailure(orderId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) throw new BadRequestException('Order not found');

      // Update statuses to indicate failure
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.PENDING, // Still pending, allowing retry
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      // Fire failure email
      if (order.user) {
        const frontendUrl = this.configService.get<string>('PUBLIC_UI_FRONTEND') || '';
        const html = Templates.paymentFailedEmail({
          firstName: order.user.firstname,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          paymentLink: `${frontendUrl}/order/${order.orderNumber}`,
          expiryMinutes: 10,
        });

        await this.mailService.sendMail(
          `Anandini <info@anandini.org.in>`,
          order.user.email,
          `Action Required: Payment Failed for #${order.orderNumber}`,
          html,
        );
      }

      return { message: 'Failure recorded and user notified' };
    });
  }

  async initiatePaymentRetry(orderId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order || order.userId !== userId) {
        throw new BadRequestException('Order not found or access denied');
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException('This order is already paid');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot pay for a cancelled order');
      }

      // Check if the 24-hour hard deadline has expired
      const hardDeadline = await this.redisService.get(`order_hard_deadline:${orderId}`);
      if (!hardDeadline) {
        // If deadline expired, cancel the order automatically
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CANCELLED,
            notes: order.notes ? `${order.notes}\nPayment window expired (24h limit reached).` : 'Payment window expired (24h limit reached).',
          },
        });
        
        // Cleanup 10m timer if it exists
        await this.redisService.deleteKey(`order_expiry:${orderId}`);
        
        // Fire cancellation email
        this.sendOrderStatusEmail(orderId, OrderStatus.CANCELLED).catch(e => AppLogger.error(`Cancellation email failed: ${e.message}`));
        
        throw new BadRequestException('The payment window for this order has expired (24-hour limit reached). Please place a new order.');
      }

      // Generate a NEW Razorpay Order
      try {
        const rzpOrder = await this.razorpayService.createOrder(
          Number(order.totalAmount),
          order.orderNumber,
        );

        // Update the payment metadata with the NEW ID
        const payment = order.payments[0];
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              paymentMetadata: {
                razorpayOrderId: rzpOrder.id,
                retryAttemptedAt: new Date(),
              } as any,
            },
          });
        }

        // Refresh the 10-minute timer in Redis for this new attempt
        await this.redisService.set(`order_expiry:${order.id}`, 'pending', 600);

        return {
          razorpayOrderId: rzpOrder.id,
          razorpayKey: this.configService.get<string>('RAZORPAY_KEY_ID'),
          amount: Number(order.totalAmount),
          orderNumber: order.orderNumber,
        };
      } catch (error) {
        AppLogger.error(`Failed to regenerate Razorpay order for ${orderId}`, error.stack);
        throw new BadRequestException('Could not initiate payment. Please try again.');
      }
    });
  }

  async cancelOrder(orderId: string, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.userId !== userId) {
        throw new BadRequestException('Order not found or access denied');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(`Cannot cancel an order that is already ${order.status}`);
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          notes: order.notes ? `${order.notes}\nCancelled by user.` : 'Cancelled by user.',
        },
      });

      // Cleanup Redis timers
      await this.redisService.deleteKey(`order_expiry:${orderId}`);
      await this.redisService.deleteKey(`order_hard_deadline:${orderId}`);

      // Fire email
      this.sendOrderStatusEmail(orderId, OrderStatus.CANCELLED).catch((e) =>
        AppLogger.error(`Cancellation email failed: ${e.message}`),
      );

      return { message: 'Order cancelled successfully', order: updatedOrder };
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

      const result = this.transformOrder(updatedOrder, true);

      // Fire email (non-blocking)
      this.sendOrderStatusEmail(orderId, dto.status).catch(e => AppLogger.error(`Email failed: ${e.message}`));

      return result;
    });
  }

  private async sendOrderStatusEmail(orderId: string, status: OrderStatus) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: true,
          payments: true,
        },
      });

      if (!order || !order.user) return;

      const frontendUrl = this.configService.get<string>('PUBLIC_UI_FRONTEND') || '';
      
      let html = '';
      let subject = `Order Update: #${order.orderNumber} - ${status}`;

      if (status === OrderStatus.CANCELLED) {
        html = Templates.orderCancelledEmail({
          firstName: order.user.firstname,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          frontendUrl: frontendUrl,
        });
        subject = `Order Cancelled: #${order.orderNumber}`;
      } else {
        html = Templates.orderUpdateEmail({
          firstName: order.user.firstname,
          orderNumber: order.orderNumber,
          status: status,
          totalAmount: Number(order.totalAmount),
          items: order.items,
          shippingAddress: order.shippingAddress,
          frontendUrl: frontendUrl,
          paymentMethod: order.payments?.[0]?.provider,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        });
      }

      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        order.user.email,
        subject,
        html,
      );
    } catch (error) {
      AppLogger.error(`Failed to send order status email for order ${orderId}`, error.stack);
    }
  }

  private transformOrder(order: any, isStaff: boolean = false) {
    if (!order) return order;

    // Group price breakdown into a standardized paymentSummary object for the frontend
    order.paymentSummary = {
      subtotal: Number(order.subtotal || 0),
      gstAmount: Number(order.gstAmount || 0),
      deliveryFee: Number(order.deliveryFee || 0),
      totalAmount: Number(order.totalAmount || 0),
      gstRate: 18,
      deliveryThreshold: 1000,
    };

    // Remove the flat fields from the root to keep the response clean
    delete order.subtotal;
    delete order.gstAmount;
    delete order.deliveryFee;
    delete order.totalAmount;

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
