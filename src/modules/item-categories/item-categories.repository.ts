import {
  BadRequestException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class ItemCategoryRepo {
  constructor(private readonly prismaService: PrismaService) {}

  // ─── Shared select projection ────────────────────────────────────────────────
  private get categorySelectFields(): Prisma.CategoryMasterSelect {
    return {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: true,
      createdBy: true,
      updatedBy: true,
      // createdBy / updatedBy user relations
      user: true,
      images: {
        select: { ownerType: true, imageUrl: true, publicId: true },
        where: { ownerType: { in: ['CATEGORY_IMAGE', 'CATEGORY_BANNER'] } },
      },
    };
  }
  // ─────────────────────────────────────────────────────────────────────────────

  async addCategory(
    data: CreateItemCategoryDto | CreateItemCategoryDto[],
    userId: string,
  ) {
    try {
      if (Array.isArray(data)) {
        const bulkData = data.map((d) => {
          const { bannerimage, categoryImage, ...rest } = d;
          return { ...rest, createdBy: userId, updatedBy: userId };
        });

        await this.prismaService.categoryMaster.createMany({
          data: bulkData,
          skipDuplicates: true,
        });

        return this.prismaService.categoryMaster.findMany({
          where: { createdBy: userId },
          orderBy: { id: 'desc' }, // newest first
          take: bulkData.length,
          select: this.categorySelectFields,
        });
      } else {
        const { bannerimage, categoryImage, ...categoryData } =
          data as CreateItemCategoryDto;
        return await this.prismaService.categoryMaster.create({
          data: { ...categoryData, createdBy: userId, updatedBy: userId },
          select: this.categorySelectFields,
        });
      }
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
        select: this.categorySelectFields,
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
      const { bannerimage, categoryImage, deletedImagePublicIds, ...categoryData } = data;
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data: categoryData,
        select: this.categorySelectFields,
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
        data: { isActive: false },
        select: this.categorySelectFields,
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
          where: { isActive: true },
          orderBy: {
            [`${paginatinObject.sortBy || 'createdAt'}`]: paginatinObject.isAsc
              ? 'asc'
              : 'desc',
          },
          skip: (paginatinObject.page - 1) * paginatinObject.limit,
          take: paginatinObject.limit,
          select: this.categorySelectFields,
        }),
        this.prismaService.categoryMaster.count({
          where: { isActive: true },
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
          select: this.categorySelectFields,
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
