import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class CartItemsRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async addCartItem(
    userId: number,
    itemId: number,
    cartId: number,
    data: CreateCartItemDto,
  ) {
    try {
      return await this.prismaService.cartItem.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId,
          },
        },
        update: {
          quantity: { increment: 1 },
          realPrice: data.realPrice ? Number(data.realPrice) : undefined,
          discountedPrice: data.discountedPrice
            ? Number(data.discountedPrice)
            : undefined,
        },
        create: {
          quantity: 1,
          realPrice: data.realPrice ?? 0, // you could fetch this from Item table
          discountedPrice: data.discountedPrice ?? data.realPrice ?? 0,
          userId,
          cartId,
          itemId,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async editCartItem(
    userId: number,
    itemId: number,
    cartId: number,
    data: UpdateCartItemDto,
  ) {
    try {
      return await this.prismaService.cartItem.update({
        where: {
          // composite unique constraint lets you identify the row
          userId_itemId: {
            userId,
            itemId,
          },
        },
        data: {
          quantity: { increment: 1 },
          realPrice: data.realPrice ?? 0,
          discountedPrice: data.discountedPrice ?? 0,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async getCartItemCount(cartId: number, userId: number) {
    try {
      const [count, items] = await this.prismaService.$transaction([
        this.prismaService.cartItem.count({
          where: { cartId: cartId, userId: userId },
        }),
        this.prismaService.cartItem.findMany({
          where: { cartId: cartId, userId: userId },
          select: {
            itemId: true,
            quantity: true,
          },
        }),
      ]);
      return {
        count,
        items,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
}
