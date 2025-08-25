import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async getCartByUserID(userId: string) {
    try {
      return await this.prismaService.cart.findFirst({
        where: { userId: userId },
        select: {
          id: true,
          createdAt: true,
          isActive: true,
          name: true,
          items: {
            select:{
              item:{
                select:{
                  id:true,
                  name:true,
                  price:true,
                  images:true,
                  inventories:true,
                  description:true,
                  isActive:true,
                  isAvailable:true,
                  rating:true,
                }
              },
              id:true,
              cartId:true,
              quantity:true,
              addedAt:true
            }
          },
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
  async addCartRow(userId: string) {
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

  async getFinalCartCount(userId: string, cartId: string) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cartItemCount = await tx.cartItem.count({
          where: { cartId: cartId, userId },
        });
        const addedItems = await tx.cartItem.findMany({
          where: { cartId: cartId, userId: userId },
          select: {
            itemId: true,
            quantity: true,
          },
        });
        return { cartItemCount, addedItems };
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
    userId: string,
    itemId: string,
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
          },
          create: {
            quantity: 1,
            userId,
            cartId: cart.id, // ✅ now works fine
            itemId,
          },
        });

        // const cartCount = await tx.cartItem.count({
        //   where: { cartId: cart.id, userId },
        // });
        // const addedItems = await tx.cartItem.findMany({
        //   where: { cartId: cart.id, userId: userId },
        //   select: {
        //     itemId: true,
        //     quantity: true,
        //   },
        // });
        return { cart, cartItem };
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
