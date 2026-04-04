import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateItemRepoDto } from './dto/create-item.dto';
import { UpdateItemRepoDto } from './dto/update-item.dto';
import { FilterItemDto, SearchItemDto } from './dto/filter-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
