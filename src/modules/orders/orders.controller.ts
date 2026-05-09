import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  InternalServerErrorException,
  HttpException,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderSearchDto } from './dto/order-search.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { RolesGuard } from 'src/auth/guards/role-auth.guard';

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

  @Post('/list')
  async listOrders(@CurrentUser() user: User, @Body() searchDto: OrderSearchDto) {
    try {
      return await this.ordersService.listOrders(searchDto, user);
    } catch (error: any) {
      AppLogger.error(`Failed to fetch orders`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch orders',
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

  @Post('/confirm/:id')
  @Roles('admin', 'employee', 'manager')
  @UseGuards(RolesGuard)
  async confirmOrder(
    @Param('id') id: string,
    @Body('transactionId') transactionId?: string,
  ) {
    try {
      return await this.ordersService.confirmOrderManually(id, transactionId);
    } catch (error: any) {
      AppLogger.error(`Order confirmation failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Order confirmation failed',
      });
    }
  }

  @Patch('/status/:id')
  @Roles('admin', 'employee', 'manager')
  @UseGuards(RolesGuard)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.ordersService.updateOrderStatus(id, dto, user);
    } catch (error: any) {
      AppLogger.error(`Order status update failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Order status update failed',
      });
    }
  }
}
