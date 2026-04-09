import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ListReviewsDto, UpdateReviewDto } from './dto/review.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Submit a new review for an item or branch.
   * Requires login + verified purchase of the item/branch.
   * reviewType (ITEM | BRANCH) determines which target ID is used.
   */
  @Post()
  async create(@Body() dto: CreateReviewDto, @CurrentUser() user: User) {
    try {
      return await this.reviewsService.create(user.id, dto);
    } catch (error: any) {
      AppLogger.error('Failed to submit review', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to submit review.',
      });
    }
  }

  /**
   * GET /reviews/item/:itemId?page=1&limit=10&sortBy=createdAt&isAsc=false
   * Public — anyone (including guests) can read reviews for an item.
   */
  @Public('listItemReviews')
  @Get('/item/:itemId')
  async listByItem(
    @Param('itemId') itemId: string,
    @Query() pagination: ListReviewsDto,
  ) {
    try {
      return await this.reviewsService.listByItem(itemId, pagination);
    } catch (error: any) {
      AppLogger.error('Failed to list reviews', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch reviews.',
      });
    }
  }

  /**
   * PATCH /reviews/:id
   * Update your own review — same purchase gate as POST.
   * Requires login.
   */
  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.reviewsService.update(user.id, id, dto);
    } catch (error: any) {
      AppLogger.error('Failed to update review', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update review.',
      });
    }
  }

  /**
   * DELETE /reviews/:id
   * Delete your own review.
   * Requires login — no purchase gate, just ownership.
   */
  @Delete('/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      return await this.reviewsService.remove(user.id, id);
    } catch (error: any) {
      AppLogger.error('Failed to delete review', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete review.',
      });
    }
  }
}
