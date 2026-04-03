import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Add an item to a user's wishlist.
   * Uses upsert to silently handle duplicates.
   */
  async addToWishlist(userId: string, itemId: string) {
    try {
      return await this.prismaService.userWishlist.upsert({
        where: { userId_itemId: { userId, itemId } },
        update: {},
        create: { userId, itemId },
        select: {
          id: true,
          userId: true,
          itemId: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
              isAvailable: true,
              isActive: true,
              rating: true,
            },
          },
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while adding to wishlist.',
      });
    }
  }

  /**
   * Remove a single item from a user's wishlist.
   */
  async removeFromWishlist(userId: string, itemId: string) {
    try {
      return await this.prismaService.userWishlist.delete({
        where: { userId_itemId: { userId, itemId } },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while removing from wishlist.',
      });
    }
  }

  /**
   * Clear the entire wishlist for a user.
   */
  async clearWishlist(userId: string) {
    try {
      return await this.prismaService.userWishlist.deleteMany({
        where: { userId },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while clearing wishlist.',
      });
    }
  }

  /**
   * Get all wishlist items for a user with item details.
   */
  async getWishlist(userId: string) {
    try {
      return await this.prismaService.userWishlist.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          item: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              rating: true,
              isAvailable: true,
              isActive: true,
              images: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              offer: {
                select: {
                  id: true,
                  name: true,
                  discountType: true,
                  discountValue: true,
                  maxDiscountAmount: true,
                  validFrom: true,
                  validUpto: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching wishlist.',
      });
    }
  }

  /**
   * Check if a specific item is already wishlisted by the user.
   */
  async isWishlisted(userId: string, itemId: string) {
    try {
      const entry = await this.prismaService.userWishlist.findUnique({
        where: { userId_itemId: { userId, itemId } },
        select: { id: true },
      });
      return !!entry;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }

  /**
   * Get all wishlist item IDs for a user (lightweight, for frontend sync).
   */
  async getWishlistedItemIds(userId: string) {
    try {
      const entries = await this.prismaService.userWishlist.findMany({
        where: { userId },
        select: { itemId: true },
      });
      return entries.map((e) => e.itemId);
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
}
