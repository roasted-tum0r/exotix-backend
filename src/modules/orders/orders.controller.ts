import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('/checkout')
  async checkout(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    try {
      return await this.ordersService.checkout(user, createOrderDto);
    } catch (error: any) {
      AppLogger.error(`Order checkout failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Order checkout failed',
      });
    }
  }

  @Get('/:id')
  async getOrder(@CurrentUser() user: User, @Param('id') id: string) {
    try {
      return await this.ordersService.getOrderDetails(id, user);
    } catch (error: any) {
      AppLogger.error(`Failed to fetch order details`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch order details',
      });
    }
  }

  @Post('/:id/confirm')
  async confirmOrder(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('transactionId') transactionId?: string,
  ) {
    try {
      return await this.ordersService.confirmOrderManually(id, user, transactionId);
    } catch (error: any) {
      AppLogger.error(`Order confirmation failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Order confirmation failed',
      });
    }
  }
}
