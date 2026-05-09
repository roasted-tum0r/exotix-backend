import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchWishlistDto } from './dto/wishlist.dto';
import { ImageOwnerType, Prisma } from '@prisma/client';

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
   * Get all wishlist items for a user with item details (paginated).
   */
  async getWishlist(userId: string, pagination: SearchWishlistDto) {
    try {
      const { page, limit, sortBy, isAsc, search } = pagination;
      
      const where: Prisma.UserWishlistWhereInput = {
        userId,
        ...(search && {
          item: {
            OR: [
              { name: { contains: search } as Prisma.StringFilter<'Item'> },
              { description: { contains: search } as Prisma.StringFilter<'Item'> },
            ],
          },
        }),
      };

      const [results, total] = await Promise.all([
        this.prismaService.userWishlist.findMany({
          where,
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
                images: {
                  select: { ownerType: true, imageUrl: true, publicId: true },
                  where: {
                    ownerType: { in: [ImageOwnerType.ITEM_THUMBNAIL, ImageOwnerType.ITEM_GALLERY] },
                  },
                },
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
                // Since this IS the wishlist, we know it's wishlisted for this user
                wishlists: {
                  where: { userId },
                  select: { id: true },
                },
              },
            },
          },
          orderBy: { [sortBy]: isAsc ? 'asc' : 'desc' },
          skip: (+page - 1) * +limit,
          take: +limit,
        }),
        this.prismaService.userWishlist.count({ where }),
      ]);

      return {
        results: results.map((r) => {
          const transformedItem = this.transformItemImages(r.item);
          return {
            ...r,
            item: transformedItem,
          };
        }),
        meta: {
          total,
          currentPage: +page,
          totalPages: Math.ceil(total / +limit),
        },
      };
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
   * Helper to transform item images (similar to ItemsRepository)
   */
  private transformItemImages(item: any) {
    if (!item) return null;
    const { images = [], wishlists = [], ...rest } = item;
    return {
      ...rest,
      thumbnail: images.find((img) => img.ownerType === ImageOwnerType.ITEM_THUMBNAIL) ?? null,
      gallery: images.filter((img) => img.ownerType === ImageOwnerType.ITEM_GALLERY),
      isWishlisted: wishlists.length > 0,
    };
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
