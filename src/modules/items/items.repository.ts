import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateItemRepoDto } from './dto/create-item.dto';
import { UpdateItemRepoDto } from './dto/update-item.dto';
import { FilterItemDto, RecommendationPaginationDto, SearchItemDto } from './dto/filter-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

const RECOMMENDATION_SELECT = {
  id: true,
  name: true,
  image: true,
  price: true,
  rating: true,
  isAvailable: true,
  offer: true,
  category: { select: { id: true, name: true } },
};

@Injectable()
export class ItemsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateItemRepoDto) {
    try {
      return this.prisma.item.create({ data });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async findOne(id: string) {
    try {
      return this.prisma.item.findUnique({
        where: { id, isActive: true },
        // include: { category: true, images: true, reviews: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          category: true,
          images: true,
          categoryId: true,
          reviews: true,
          rating: true,
          isAvailable: true,
          price: true,
          image: true,
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
  async findBulk(ids: string[]) {
    try {
      return this.prisma.item.findMany({
        where: {
          ...(ids?.length && { id: { in: ids } }),
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          isAvailable: true,
          cartItems: {
            select: {
              id: true,
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
  async addItemDetails(itemId: string) {
    try {
      return await this.prisma.item.findUnique({
        where: { id: itemId, isActive: true },
        select: {
          id: true,
          isAvailable: true,
          name: true,
          cartItems: {
            select: {
              id: true,
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
  async update(id: string, data: UpdateItemRepoDto) {
    try {
      return this.prisma.item.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          category: true,
          images: true,
          categoryId: true,
          reviews: true,
          rating: true,
          isAvailable: true,
          price: true,
          image: true,
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
  async remove(ids: string[]) {
    try {
      return this.prisma.item.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
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
  async findAllItems(pagination: SearchItemDto, where: Prisma.ItemWhereInput) {
    try {
      const [results, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          orderBy: {
            [`${pagination.sortBy}`]: pagination.isAsc ? 'asc' : 'desc',
          },
          skip: (+pagination.page - 1) * +pagination.limit,
          take: +pagination.limit,
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: { id: true, name: true },
            },
            images: true,
            categoryId: true,
            reviews: true,
            rating: true,
            isAvailable: true,
            price: true,
            image: true,
            _count: true,
            offer: true,
          },
        }),
        this.prisma.item.count({ where }),
      ]);

      return {
        meta: {
          total,
          currentPage: +pagination.page,
          totalPages: Math.ceil(total / pagination.limit),
        },
        results,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async addToFavourite(userId: string, itemId: string) {
    try {
      return await this.prisma.userFavourite.create({
        data: {
          userId,
          itemId,
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

  async addToWishlist(userId: string, itemId: string) {
    try {
      return await this.prisma.userWishlist.create({
        data: {
          userId,
          itemId,
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

  async getSuggestions(search: string) {
    try {
      const term = search.toLowerCase();
      const [items, categories] = await Promise.all([
        this.prisma.item.findMany({
          where: {
            isActive: true,
            isAvailable: true,
            name: { contains: term } as Prisma.StringFilter<'Item'>,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            image: true,
            price: true,
            rating: true,
            offer: true,
            category: { select: { id: true, name: true } },
          },
        }),
        this.prisma.categoryMaster.findMany({
          where: {
            isActive: true,
            name: { contains: term } as Prisma.StringFilter<'CategoryMaster'>,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, image: true, description: true },
        }),
      ]);
      return { items, categories };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async getLatestItems() {
    try {
      return this.prisma.item.findMany({
        where: { isActive: true, isAvailable: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          rating: true,
          offer: true,
          category: { select: { id: true, name: true } },
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

  /**
   * GET /items/:id/similar
   * Items in the same category — fully paginated.
   */
  async getSimilarItems(
    itemId: string,
    categoryId: string,
    pagination: RecommendationPaginationDto,
  ): Promise<{ results: any[]; total: number }> {
    try {
      const { page, limit, sortBy, isAsc } = pagination;
      const where: Prisma.ItemWhereInput = {
        id: { not: itemId },
        categoryId,
        isActive: true,
        isAvailable: true,
      };
      const [results, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          orderBy: { [sortBy]: isAsc ? 'asc' : 'desc' },
          skip: (+page - 1) * +limit,
          take: +limit,
          select: RECOMMENDATION_SELECT,
        }),
        this.prisma.item.count({ where }),
      ]);
      return { results, total };
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
   * GET /items/:id/also-like
   * Items within ±30% price range — fully paginated.
   */
  async getAlsoLikeItems(
    itemId: string,
    price: number,
    pagination: RecommendationPaginationDto,
  ): Promise<{ results: any[]; total: number }> {
    try {
      const { page, limit, sortBy, isAsc } = pagination;
      const where: Prisma.ItemWhereInput = {
        id: { not: itemId },
        isActive: true,
        isAvailable: true,
        price: { gte: price * 0.7, lte: price * 1.3 },
      };
      const [results, total] = await Promise.all([
        this.prisma.item.findMany({
          where,
          orderBy: { [sortBy]: isAsc ? 'asc' : 'desc' },
          skip: (+page - 1) * +limit,
          take: +limit,
          select: RECOMMENDATION_SELECT,
        }),
        this.prisma.item.count({ where }),
      ]);
      return { results, total };
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
   * GET /items/:id/also-bought
   * Co-purchased items ranked by order co-occurrence — fully paginated.
   * Uses raw SQL since Prisma doesn't support self-join aggregation natively.
   */
  async getAlsoBoughtItems(
    itemId: string,
    pagination: RecommendationPaginationDto,
  ): Promise<{ results: any[]; total: number }> {
    try {
      const { page, limit } = pagination;
      const offset = (+page - 1) * +limit;

      // Run paginated ranked rows + total count in parallel
      const [rows, countRows] = await Promise.all([
        this.prisma.$queryRaw<{ itemId: string; score: bigint }[]>(
          Prisma.sql`
            SELECT oi2.itemId, COUNT(*) AS score
            FROM OrderItem oi1
            JOIN OrderItem oi2
              ON oi1.orderId = oi2.orderId
              AND oi2.itemId != oi1.itemId
            WHERE oi1.itemId = ${itemId}
            GROUP BY oi2.itemId
            ORDER BY score DESC
            LIMIT ${+limit} OFFSET ${offset}
          `,
        ),
        this.prisma.$queryRaw<{ total: bigint }[]>(
          Prisma.sql`
            SELECT COUNT(DISTINCT oi2.itemId) AS total
            FROM OrderItem oi1
            JOIN OrderItem oi2
              ON oi1.orderId = oi2.orderId
              AND oi2.itemId != oi1.itemId
            WHERE oi1.itemId = ${itemId}
          `,
        ),
      ]);

      const total = Number(countRows[0]?.total ?? 0);

      if (!rows.length) return { results: [], total };

      const itemIds = rows.map((r) => r.itemId);

      const items = await this.prisma.item.findMany({
        where: { id: { in: itemIds }, isActive: true, isAvailable: true },
        select: RECOMMENDATION_SELECT,
      });

      // Restore co-purchase rank order
      const results = itemIds
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean);

      return { results, total };
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
