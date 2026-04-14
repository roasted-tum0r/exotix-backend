import {
  BadRequestException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLogger } from 'src/common/utils/app.logger';
import { ListReviewsDto } from './dto/review.dto';
import { ImageOwnerType, Prisma } from '@prisma/client';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) { }

  // ─── Read ────────────────────────────────────────────────────────────

  /**
   * Fetch a single review by its primary key.
   */
  async findById(id: string) {
    try {
      return await this.prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          rating: true,
          userId: true,
          itemId: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, firstname: true, lastname: true },
          },
          images: { select: { id: true, imageUrl: true } },
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching review.',
      });
    }
  }

  /**
   * Paginated list of reviews for a given item.
   */
  async listByItem(itemId: string, pagination: ListReviewsDto) {
    try {
      const where: Prisma.ReviewWhereInput = { itemId };
      const orderBy: Prisma.ReviewOrderByWithRelationInput = {
        [pagination.sortBy]: pagination.isAsc ? 'asc' : 'desc',
      };
      const skip = (+pagination.page - 1) * +pagination.limit;
      const take = +pagination.limit;

      const [results, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          orderBy,
          skip,
          take,
          select: {
            id: true,
            content: true,
            rating: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: { id: true, firstname: true, lastname: true },
            },
            images: { select: { ownerType: true, id: true, imageUrl: true }, where: { ownerType: ImageOwnerType.REVIEW } },
          },
        }),
        this.prisma.review.count({ where }),
      ]);

      return {
        meta: {
          total,
          currentPage: +pagination.page,
          totalPages: Math.ceil(total / +pagination.limit),
        },
        results,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while listing reviews.',
      });
    }
  }

  // ─── Write ───────────────────────────────────────────────────────────

  async create(data: {
    userId: string;
    content: string;
    rating: number;
    itemId?: string;
    branchId?: string;
  }) {
    try {
      return await this.prisma.review.create({
        data,
        select: {
          id: true,
          content: true,
          rating: true,
          userId: true,
          itemId: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while creating review.',
      });
    }
  }

  async update(
    id: string,
    data: { content?: string; rating?: number },
  ) {
    try {
      return await this.prisma.review.update({
        where: { id },
        data,
        select: {
          id: true,
          content: true,
          rating: true,
          userId: true,
          itemId: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while updating review.',
      });
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.review.delete({ where: { id } });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deleting review.',
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  /**
   * Check if a user has a DELIVERED order that contains a given itemId.
   */
  async hasUserPurchasedItem(userId: string, itemId: string) {
    try {
      const hit = await this.prisma.orderItem.findFirst({
        where: {
          itemId,
          order: {
            userId,
            status: 'DELIVERED',
          },
        },
        select: { id: true },
      });
      return !!hit;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while verifying purchase.',
      });
    }
  }

  /**
   * Check if a user has a DELIVERED order placed at a given branch.
   */
  async hasUserOrderedAtBranch(userId: string, branchId: string) {
    try {
      const hit = await this.prisma.order.findFirst({
        where: { userId, branchId, status: 'DELIVERED' },
        select: { id: true },
      });
      return !!hit;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while verifying branch order.',
      });
    }
  }

  /**
   * Look up an existing review for (userId, itemId) or (userId, branchId).
   */
  async findExisting(userId: string, itemId?: string, branchId?: string) {
    try {
      if (itemId) {
        return await this.prisma.review.findUnique({
          where: { userId_itemId: { userId, itemId } },
          select: { id: true, userId: true },
        });
      }
      if (branchId) {
        return await this.prisma.review.findUnique({
          where: { userId_branchId: { userId, branchId } },
          select: { id: true, userId: true },
        });
      }
      return null;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while checking existing review.',
      });
    }
  }
}
