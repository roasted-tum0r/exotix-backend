import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateItemDto, CreateItemRepoDto } from './dto/create-item.dto';
import { UpdateItemDto, UpdateItemRepoDto } from './dto/update-item.dto';
import { FilterItemDto } from './dto/filter-item.dto';
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
          discountPercentage: true,
          discountEnd: true,
          discountStart: true,
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
          skip: (paginatinObject.page - 1) * paginatinObject.limit,
          take: paginatinObject.limit,
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            category: true,
            images: true,
            categoryId: true,
            discountPercentage: true,
            discountEnd: true,
            discountStart: true,
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
        total,
        currentPage: paginatinObject.page,
        totalPages: Math.ceil(total / paginatinObject.limit),
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
  async findOne(id: number) {
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
          discountPercentage: true,
          discountEnd: true,
          discountStart: true,
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
  async findBulk(ids: number[]) {
    try {
      return this.prisma.item.findMany({
        where: {
          ...(ids?.length && { id: { in: ids } }),
          isActive: true,
        },
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
          discountPercentage: true,
          discountEnd: true,
          discountStart: true,
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
  async update(id: number, data: UpdateItemRepoDto) {
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
          discountPercentage: true,
          discountEnd: true,
          discountStart: true,
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
  async remove(id: number) {
    try {
      return this.prisma.item.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          category: true,
          images: true,
          categoryId: true,
          discountPercentage: true,
          discountEnd: true,
          discountStart: true,
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
}
