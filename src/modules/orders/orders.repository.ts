import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async getOrderById(orderId: string, userId: string) {
    return await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: true,
      },
    });
  }

  async confirmPayment(orderId: string, userId: string, transactionId?: string) {
    return await this.prisma.$transaction(async (tx) => {
       const order = await tx.order.findFirst({
         where: { id: orderId, userId }
       });

       if(!order) throw new BadRequestException('Order not found');

       await tx.order.update({
         where: { id: orderId },
         data: {
           paymentStatus: PaymentStatus.PAID,
           status: OrderStatus.CONFIRMED
         }
       });

       await tx.payment.updateMany({
         where: { orderId },
         data: {
           status: PaymentStatus.PAID,
           transactionId: transactionId || `MANUAL-${Date.now()}`
         }
       });

       return { message: 'Order confirmed successfully' };
    });
  }
}
