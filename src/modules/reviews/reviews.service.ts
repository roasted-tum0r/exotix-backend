import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto, ListReviewsDto, ReviewType, UpdateReviewDto } from './dto/review.dto';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class ReviewsService {
  constructor(private readonly repo: ReviewsRepository) {}

  // ─── POST /reviews ────────────────────────────────────────────────────

  async create(userId: string, dto: CreateReviewDto) {
    try {
      // 1. Validate that the right target ID was supplied
      if (dto.reviewType === ReviewType.ITEM && !dto.itemId) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: true,
          message: 'itemId is required when reviewType is ITEM.',
        });
      }
      if (dto.reviewType === ReviewType.BRANCH && !dto.branchId) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: true,
          message: 'branchId is required when reviewType is BRANCH.',
        });
      }

      // 2. Verified purchase check
      if (dto.reviewType === ReviewType.ITEM) {
        const purchased = await this.repo.hasUserPurchasedItem(userId, dto.itemId!);
        if (!purchased) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: true,
            message: 'You can only review items you have purchased and received.',
          });
        }
      } else {
        const ordered = await this.repo.hasUserOrderedAtBranch(userId, dto.branchId!);
        if (!ordered) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: true,
            message: 'You can only review a branch you have ordered from and received a delivery.',
          });
        }
      }

      // 3. One review per target check
      const existing = await this.repo.findExisting(userId, dto.itemId, dto.branchId);
      if (existing) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: true,
          message: 'You have already submitted a review for this item/branch. Use PATCH to update it.',
        });
      }

      // 4. Create
      const review = await this.repo.create({
        userId,
        content: dto.content,
        rating: dto.rating,
        itemId: dto.itemId,
        branchId: dto.branchId,
      });

      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Review submitted successfully.',
        data: review,
      };
    } catch (error: any) {
      AppLogger.error('Failed to create review', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to submit review.',
      });
    }
  }

  // ─── GET /reviews/item/:itemId ─────────────────────────────────────────

  async listByItem(itemId: string, pagination: ListReviewsDto) {
    try {
      const data = await this.repo.listByItem(itemId, pagination);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Reviews fetched.',
        data,
      };
    } catch (error: any) {
      AppLogger.error('Failed to list reviews', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch reviews.',
      });
    }
  }

  // ─── PATCH /reviews/:id ────────────────────────────────────────────────

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    try {
      // 1. Fetch review and confirm ownership
      const review = await this.repo.findById(reviewId);
      if (!review) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Review not found.',
        });
      }
      if (review.userId !== userId) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: true,
          message: 'You can only edit your own reviews.',
        });
      }

      // 2. Verified purchase check (re-validate on update too)
      if (review.itemId) {
        const purchased = await this.repo.hasUserPurchasedItem(userId, review.itemId);
        if (!purchased) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: true,
            message: 'You can only edit reviews for items you have purchased.',
          });
        }
      } else if (review.branchId) {
        const ordered = await this.repo.hasUserOrderedAtBranch(userId, review.branchId);
        if (!ordered) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: true,
            message: 'You can only edit reviews for branches you have ordered from.',
          });
        }
      }

      const updated = await this.repo.update(reviewId, dto);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Review updated successfully.',
        data: updated,
      };
    } catch (error: any) {
      AppLogger.error('Failed to update review', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update review.',
      });
    }
  }

  // ─── DELETE /reviews/:id ───────────────────────────────────────────────

  async remove(userId: string, reviewId: string) {
    try {
      // Only ownership check — no purchase gate on delete
      const review = await this.repo.findById(reviewId);
      if (!review) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Review not found.',
        });
      }
      if (review.userId !== userId) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: true,
          message: 'You can only delete your own reviews.',
        });
      }

      await this.repo.remove(reviewId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Review deleted successfully.',
        data: null,
      };
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
