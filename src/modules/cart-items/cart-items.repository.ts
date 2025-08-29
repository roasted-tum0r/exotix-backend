import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class CartItemsRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async addCartItem(
    userId: string,
    itemId: string,
    cartId: string,
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
        },
        create: {
          quantity: 1,
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
    userId: string,
    itemId: string,
    data: UpdateCartItemDto,
    isGuestCart: boolean,
  ) {
    try {
      return await this.prismaService.cartItem.update({
        where: isGuestCart
          ? { guestId_itemId: { guestId: userId, itemId }, cartId: data.cartId }
          : { userId_itemId: { userId: userId, itemId }, cartId: data.cartId },
        data: {
          quantity: {
            [data.updateType]: data.quantity! > 0 ? data.quantity! : 1,
          },
        },
        select: {
          id: true,
          itemId: true,
          quantity: true,
          cartId: true,
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
  async getCartItemCount(cartId: string, userId: string) {
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
  async deleteCartItem(
    userId: string,
    itemId: string,
    cartId: string,
    isGuestCart: boolean,
  ) {
    try {
      return await this.prismaService.cartItem.delete({
        where: isGuestCart
          ? { guestId_itemId: { guestId: userId, itemId }, cartId: cartId }
          : { userId_itemId: { userId: userId, itemId }, cartId: cartId },
        select: {
          id: true,
          itemId: true,
          quantity: true,
          cartId: true,
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
}
