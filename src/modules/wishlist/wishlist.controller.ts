import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
  InternalServerErrorException,
  HttpException,
  Query,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/wishlist.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /**
   * POST /wishlist/add
   * Add an item to the current user's wishlist.
   * Requires login — no @Public().
   */
  @Post('/add')
  async addToWishlist(
    @Body() dto: AddToWishlistDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.wishlistService.addToWishlist(user.id, dto.itemId);
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
   * DELETE /wishlist/remove
   * Remove a single item from the current user's wishlist.
   * Requires login.
   */
  @Delete('/remove')
  async removeFromWishlist(
    @Query('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.wishlistService.removeFromWishlist(user.id, itemId);
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
   * DELETE /wishlist/clear
   * Clear the entire wishlist for the current user.
   * Requires login.
   */
  @Delete('/clear')
  async clearWishlist(@CurrentUser() user: User) {
    try {
      return await this.wishlistService.clearWishlist(user.id);
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
   * GET /wishlist
   * Get the full wishlist with item details for the current user.
   * Requires login.
   */
  @Get()
  async getWishlist(@CurrentUser() user: User) {
    try {
      return await this.wishlistService.getWishlist(user.id);
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
   * GET /wishlist/ids
   * Get only wishlisted item IDs (lightweight, for frontend state sync).
   * Requires login.
   */
  @Get('/ids')
  async getWishlistedIds(@CurrentUser() user: User) {
    try {
      return await this.wishlistService.getWishlistedIds(user.id);
    } catch (error: any) {
      AppLogger.error(`Failed to get wishlisted IDs`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch wishlisted IDs.',
      });
    }
  }

  /**
   * GET /wishlist/check?itemId=xxx
   * Check if a specific item is in the current user's wishlist.
   * Requires login.
   */
  @Get('/check')
  async checkWishlisted(
    @Query('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.wishlistService.checkWishlisted(user.id, itemId);
    } catch (error: any) {
      AppLogger.error(`Failed to check wishlist status`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to check wishlist status.',
      });
    }
  }
}
