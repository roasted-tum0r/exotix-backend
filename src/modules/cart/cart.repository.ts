import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) { }
  async getCartByUserID(userId: string, isGuestCart: boolean) {
    try {
      return await this.prismaService.cart.findUnique({
        where: isGuestCart
          ? { guestId_isActive: { guestId: userId, isActive: true } }
          : { userId_isActive: { userId, isActive: true } },
        select: {
          id: true,
          createdAt: true,
          isActive: true,
          name: true,
          items: {
            select: {
              item: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    select: { ownerType: true, imageUrl: true, publicId: true },
                    where: {
                      ownerType: { in: ['ITEM_THUMBNAIL', 'ITEM_GALLERY'] },
                    },
                  },
                  inventories: true,
                  description: true,
                  isActive: true,
                  isAvailable: true,
                  rating: true,
                },
              },
              id: true,
              cartId: true,
              quantity: true,
              addedAt: true,
            },
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
  async getFinalCartCount(
    userId: string,
    cartId: string,
    isGuestCart: boolean,
  ) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cartItemCount = await tx.cartItem.count({
          where: {
            cartId: cartId,
            [isGuestCart ? 'guestId' : 'userId']: userId,
          },
        });
        const addedItems = await tx.cartItem.findMany({
          where: {
            cartId: cartId,
            [isGuestCart ? 'guestId' : 'userId']: userId,
          },
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
    isGuestCart: boolean,
  ) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
          where: isGuestCart
            ? { guestId_isActive: { guestId: userId, isActive: true } }
            : { userId_isActive: { userId: userId, isActive: true } },
          update: {},
          create: {
            name: `New cart for ${firstname}`,
            [isGuestCart ? 'guestId' : 'userId']: userId,
          },
          select: { id: true },
        });

        const cartItem = await tx.cartItem.upsert({
          where: isGuestCart
            ? { guestId_itemId: { guestId: userId, itemId } }
            : { userId_itemId: { userId: userId, itemId } },
          update: {
            quantity: { increment: 1 },
            cartId: cart.id, // Move item to current active cart if it exists in an old one
          },
          create: {
            quantity: 1,
            [isGuestCart ? 'guestId' : 'userId']: userId,
            cartId: cart.id,
            itemId,
          },
        });
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
  async mergeCart(userId: string, guestUserId: string, firstName: string) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
          where: {
            userId_isActive: {
              userId,
              isActive: true,
            },
          },
          update: {}, // No changes needed to existing active cart
          create: {
            name: `New cart for ${firstName}`,
            userId,
          },
          select: { id: true },
        });

        // Use parameterized $executeRaw to prevent SQL injection
        // ON DUPLICATE KEY UPDATE handles summing quantities and moving items to the active cart
        const cartItem = await tx.$executeRaw`
          INSERT INTO CartItem (id, cartId, userId, itemId, quantity)
          SELECT UUID(), ${cart.id}, ${userId}, g.itemId, g.quantity
          FROM CartItem g
          WHERE g.guestId = ${guestUserId}
          ON DUPLICATE KEY UPDATE 
            quantity = CartItem.quantity + VALUES(quantity),
            cartId = VALUES(cartId);
        `;

        // Purge guest cart items and the guest cart itself
        await tx.cartItem.deleteMany({
          where: { guestId: guestUserId },
        });
        await tx.cart.deleteMany({
          where: { guestId: guestUserId },
        });

        return { cart, cartItem };
      });
    } catch (error: any) {
      AppLogger.error(`Failed to merge cart for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Failed to merge carts.`,
      });
    }
  }
  async deleteCart(cartId: string, itemIds: string[] = []) {
    try {
      return await this.prismaService.$transaction(async (tx: any) => {
        switch (true) {
          // Selective delete: remove only specified items from this cart
          case itemIds.length > 0: {
            await tx.cartItem.deleteMany({
              where: {
                cartId: cartId,
                itemId: { in: itemIds },
              },
            });
            const cartItem = await tx.cartItem.findMany({
              where: { cartId: cartId },
            });
            return { cartItem };
          }
          // Full delete: remove all items from this cart
          default: {
            await tx.cartItem.deleteMany({
              where: { cartId: cartId },
            });
            // const cart = await tx.cart.delete({
            //   where: { id: cartId },
            // });
            const cartItem = await tx.cartItem.findMany({
              where: { cartId: cartId },
            });
            return { cartItem };
          }
        }
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
