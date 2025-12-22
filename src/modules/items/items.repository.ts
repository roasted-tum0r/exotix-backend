import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateItemDto, CreateItemRepoDto } from './dto/create-item.dto';
import { UpdateItemDto, UpdateItemRepoDto } from './dto/update-item.dto';
import { FilterItemDto, SearchItemDto } from './dto/filter-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';

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
  async findAll(filters: FilterItemDto) {
    try {
      const { search, categoryIds, isAvailable, minPrice, maxPrice } = filters;
      return await this.prisma.item.findMany({
        where: {
          ...(search && {
            OR: [
              {
                name: {
                  contains: search.toLowerCase(),
                  // mode: 'insensitive',
                } as Prisma.StringFilter<'Item'>,
              },
              {
                description: {
                  contains: search.toLowerCase(),
                  // mode: 'insensitive',
                } as Prisma.StringFilter<'Item'>,
              },
            ],
          }),
          ...(categoryIds?.length && { categoryId: { in: categoryIds } }),
          ...(isAvailable !== undefined && {
            isAvailable: isAvailable === 'true',
          }),
          ...(minPrice !== undefined || maxPrice !== undefined
            ? { price: { gte: minPrice ?? 0, lte: maxPrice ?? undefined } }
            : {}),
          isActive: true,
        },
        // include: { category: true, images: true, reviews: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
            },
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
  async getAllItemsRepo(paginatinObject: IPagination) {
    try {
      const [categories, total] = await this.prisma.$transaction([
        this.prisma.item.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            [`${paginatinObject.sortBy}`]: paginatinObject.isAsc
              ? 'asc'
              : 'desc',
          },
          skip: (+paginatinObject.page - 1) * +paginatinObject.limit,
          take: +paginatinObject.limit,
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
        }),
        this.prisma.item.count({
          where: {
            isActive: true,
          },
        }),
      ]);

      return {
        meta: {
          total,
          currentPage: paginatinObject.page,
          totalPages: Math.ceil(total / paginatinObject.limit),
        },
        results: categories,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
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
}
