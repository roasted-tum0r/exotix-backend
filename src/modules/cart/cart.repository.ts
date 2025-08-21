import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async getCartByUserID(userId: number) {
    try {
      return await this.prismaService.cart.findFirst({
        where: { userId: +userId },
        select: { id: true },
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
  async addCartRow(userId: number) {
    try {
      return await this.prismaService.cart.create({
        data: {
          name: `New cart for ${userId}`,
          userId: userId,
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
  async addItemDetails(itemId: number) {
    try {
      return await this.prismaService.item.findUnique({
        where: { id: itemId, isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          discountPercentage: true,
          discountStart: true,
          discountEnd: true,
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
  async getOrCreateCart(userId: number, userName: string) {
    try {
      return await this.prismaService.cart.upsert({
        where: {
          userId_isActive: {
            userId,
            isActive: true,
          },
        }, // must be unique in schema!
        update: {}, // do nothing if already exists
        create: {
          name: `New cart for ${userName}`,
          userId,
        },
        select: { id: true },
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
  async getOrCreateCartOrItem(
    userId: number,
    itemId: number,
    firstname: string,
  ) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
          where: {
            userId_isActive: {
              userId,
              isActive: true,
            },
          },
          update: {},
          create: {
            name: `New cart for ${firstname}`,
            userId,
          },
          select: { id: true },
        });

        const cartItem = await tx.cartItem.upsert({
          where: {
            userId_itemId: {
              userId,
              itemId,
            },
          },
          update: {
            quantity: { increment: 1 },
            realPrice: 0,
            discountedPrice: 0,
          },
          create: {
            quantity: 1,
            realPrice: 0,
            discountedPrice: 0,
            userId,
            cartId: cart.id, // ✅ now works fine
            itemId,
          },
        });

        const cartCount = await tx.cartItem.count({
          where: { cartId: cart.id, userId },
        });
        const addedItems = await tx.cartItem.findMany({
          where: { cartId: cart.id, userId: userId },
          select: {
            itemId: true,
            quantity: true,
          },
        });
        return { cart, cartItem, cartCount, addedItems };
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
