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
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async checkout(user: User, createOrderDto: CreateOrderDto) {
    try {
      return await this.ordersRepository.createOrderFromCart(
        user.id,
        createOrderDto,
      );
    } catch (error) {
      AppLogger.error(`Checkout failed for user ${user.id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to process checkout');
    }
  }

  async listOrders(searchDto: OrderSearchDto) {
    try {
      return await this.ordersRepository.findAllOrders(searchDto);
    } catch (error) {
      AppLogger.error('Failed to list orders for admin', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async getUserOrders(user: User, pagination: OrderSearchDto) {
    try {
      return await this.ordersRepository.findUserOrders(user.id, pagination);
    } catch (error) {
      AppLogger.error(`Failed to fetch orders for user ${user.id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch your orders');
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
      );
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      return order;
    } catch (error) {
      AppLogger.error(`Failed to fetch order details for id ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch order details');
    }
  }

  async confirmOrderManually(orderId: string, transactionId?: string) {
    try {
      return await this.ordersRepository.confirmPayment(orderId, transactionId);
    } catch (error) {
      AppLogger.error(`Manual confirmation failed for order ${orderId}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Order confirmation failed');
    }
  }
}
