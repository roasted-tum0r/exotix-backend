import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WishlistRepository } from './wishlist.repository';
import { ItemsRepository } from '../items/items.repository';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly itemsRepository: ItemsRepository,
  ) {}

  /**
   * Add an item to the authenticated user's wishlist.
   * Validates that the item exists and is available first.
   */
  async addToWishlist(userId: string, itemId: string) {
    try {
      const item = await this.itemsRepository.addItemDetails(itemId);
      if (!item || !item.isAvailable) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item not found or no longer available.',
        });
      }
      const entry = await this.wishlistRepository.addToWishlist(userId, itemId);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item added to wishlist.',
        data: entry,
      };
    } catch (error: any) {
      AppLogger.error(`Failed to add to wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add item to wishlist.',
      });
    }
  }

  /**
   * Remove a single item from the authenticated user's wishlist.
   */
  async removeFromWishlist(userId: string, itemId: string) {
    try {
      // Check if it's actually wishlisted before trying to delete
      const wishlisted = await this.wishlistRepository.isWishlisted(
        userId,
        itemId,
      );
      if (!wishlisted) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item is not in your wishlist.',
        });
      }
      await this.wishlistRepository.removeFromWishlist(userId, itemId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Item removed from wishlist.',
        data: null,
      };
    } catch (error: any) {
      AppLogger.error(`Failed to remove from wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to remove item from wishlist.',
      });
    }
  }

  /**
   * Clear all items from the authenticated user's wishlist.
   */
  async clearWishlist(userId: string) {
    try {
      const result = await this.wishlistRepository.clearWishlist(userId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Wishlist cleared. ${result.count} item(s) removed.`,
        data: { removedCount: result.count },
      };
    } catch (error: any) {
      AppLogger.error(`Failed to clear wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to clear wishlist.',
      });
    }
  }

  /**
   * Get the full wishlist for the authenticated user with item details.
   */
  async getWishlist(userId: string) {
    try {
      const items = await this.wishlistRepository.getWishlist(userId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Wishlist fetched.',
        data: {
          count: items.length,
          items,
        },
      };
    } catch (error: any) {
      AppLogger.error(`Failed to get wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch wishlist.',
      });
    }
  }

  /**
   * Check if a specific item is in the authenticated user's wishlist.
   */
  async checkWishlisted(userId: string, itemId: string) {
    try {
      const wishlisted = await this.wishlistRepository.isWishlisted(
        userId,
        itemId,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: wishlisted ? 'Item is wishlisted.' : 'Item is not wishlisted.',
        data: { isWishlisted: wishlisted, itemId },
      };
    } catch (error: any) {
      AppLogger.error(`Failed to check wishlist status`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check wishlist status.',
      });
    }
  }

  /**
   * Get only the list of item IDs in the user's wishlist (lightweight sync endpoint).
   */
  async getWishlistedIds(userId: string) {
    try {
      const itemIds = await this.wishlistRepository.getWishlistedItemIds(userId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Wishlisted item IDs fetched.',
        data: { itemIds },
      };
    } catch (error: any) {
      AppLogger.error(`Failed to get wishlisted IDs`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch wishlisted IDs.',
      });
    }
  }
}
