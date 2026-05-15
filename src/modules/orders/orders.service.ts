import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '@prisma/client';
import { OrderSearchDto } from './dto/order-search.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async checkout(user: User, createOrderDto: CreateOrderDto) {
    try {
      const payload = await this.ordersRepository.createOrderFromCart(
        user.id,
        createOrderDto,
      );
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Order placed successfully',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Checkout failed for user ${user.id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to process checkout',
      });
    }
  }

  async listOrders(searchDto: OrderSearchDto, user: User) {
    try {
      const payload = await this.ordersRepository.findAllOrders(searchDto, user);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Orders fetched successfully',
        data: payload,
      };
    } catch (error) {
      AppLogger.error('Failed to list orders', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch orders',
      });
    }
  }

  async getOrderDetails(orderId: string, user: User) {
    try {
      const isAdminOrEmployee =
        user.role === 'ADMIN' ||
        user.role === 'EMPLOYEE' ||
        user.role === 'MANAGER';
      const order = await this.ordersRepository.getOrderById(
        orderId,
        isAdminOrEmployee ? undefined : user.id,
        isAdminOrEmployee,
      );
      if (!order) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Order not found',
        });
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Order details fetched successfully',
        data: order,
      };
    } catch (error) {
      AppLogger.error(`Failed to fetch order details for id ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch order details',
      });
    }
  }

  async confirmOrderManually(orderId: string, transactionId?: string) {
    try {
      const payload = await this.ordersRepository.confirmPayment(orderId, transactionId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Order confirmed successfully',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Manual confirmation failed for order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Order confirmation failed',
      });
    }
  }
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, user: User) {
    try {
      const payload = await this.ordersRepository.updateOrderStatus(orderId, dto, user);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Order status updated to ${dto.status}`,
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Status update failed for order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to update order status',
      });
    }
  }

  async verifyPayment(dto: VerifyPaymentDto, user: User) {
    try {
      const payload = await this.ordersRepository.verifyRazorpayPayment(
        dto.orderId,
        dto.razorpayOrderId,
        dto.razorpayPaymentId,
        dto.razorpaySignature,
        user.id,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: payload.message,
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Payment verification failed for order ${dto.orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Payment verification failed',
      });
    }
  }

  async handlePaymentFailure(orderId: string) {
    try {
      const payload = await this.ordersRepository.handlePaymentFailure(orderId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Payment failure handled',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Failed to handle payment failure for order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to record payment failure',
      });
    }
  }

  async initiatePaymentRetry(orderId: string, user: User) {
    try {
      const payload = await this.ordersRepository.initiatePaymentRetry(orderId, user.id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Payment retry initiated',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Failed to initiate payment retry for order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to initiate payment retry',
      });
    }
  }

  async cancelOrder(orderId: string, user: User) {
    try {
      const payload = await this.ordersRepository.cancelOrder(orderId, user.id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Order cancelled successfully',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Failed to cancel order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to cancel order',
      });
    }
  }
}
