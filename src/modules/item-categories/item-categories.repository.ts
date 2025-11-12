import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';
@Injectable()
export class ItemCategoryRepo {
  constructor(private readonly prismaService: PrismaService) {}
  async addCategory(
    data: CreateItemCategoryDto | CreateItemCategoryDto[],
    userId: string,
  ) {
    try {
      if (Array.isArray(data)) {
        const bulkData = data.map((d) => ({
          ...d,
          createdBy: userId,
          updatedBy: userId, // first update = creator, // pass FK directly
        }));

        await this.prismaService.categoryMaster.createMany({
          data: bulkData,
          skipDuplicates: true,
        });
        return this.prismaService.categoryMaster.findMany({
          where: { createdBy: userId },
          orderBy: { id: 'desc' }, // newest first
          take: bulkData.length,
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: true,
            user: true,
          },
        });
      } else
        return await this.prismaService.categoryMaster.create({
          data: {
            ...data,
            createdBy: userId,
            updatedBy: userId, // first update = creator, // pass FK directly
          },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: true,
            user: true,
          },
        });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async getCategoryById(id: string) {
    try {
      return await this.prismaService.categoryMaster.findUnique({
        where: { id, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async updateCategory(id: string, data: UpdateItemCategoryDto) {
    try {
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async deleteCategory(id: string) {
    try {
      await this.getCategoryById(id); // check if exists
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async getAllCategories(paginatinObject: IPagination) {
    try {
      const [categories, total] = await this.prismaService.$transaction([
        this.prismaService.categoryMaster.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            [`${paginatinObject.sortBy || 'createdAt'}`]: paginatinObject.isAsc
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
            _count: true,
          },
        }),
        this.prismaService.categoryMaster.count({
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
  async searchCategory(searchObject: ISearchObject) {
    try {
      const [categories, total] = await this.prismaService.$transaction([
        this.prismaService.categoryMaster.findMany({
          where: {
            [`${searchObject.sortBy}`]: {
              contains: searchObject.searchText?.toLowerCase(),
            },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prismaService.categoryMaster.count({
          where: {
            [`${searchObject.sortBy}`]: {
              contains: searchObject.searchText?.toLowerCase(),
            },
            isActive: true,
          },
        }),
      ]);

      return {
        total,
        results: categories,
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
}
