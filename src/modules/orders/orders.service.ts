import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async checkout(user: User, createOrderDto: CreateOrderDto) {
    return await this.ordersRepository.createOrderFromCart(user.id, createOrderDto);
  }

  async getOrderDetails(orderId: string, user: User) {
    const order = await this.ordersRepository.getOrderById(orderId, user.id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async confirmOrderManually(orderId: string, user: User, transactionId?: string) {
    return await this.ordersRepository.confirmPayment(orderId, user.id, transactionId);
  }
}
