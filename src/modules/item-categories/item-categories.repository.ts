import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImageOwnerType, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';
import { UploadRepo } from '../image-upload/upload.repo';

@Injectable()
export class ItemCategoryRepo {
  constructor(private readonly prismaService: PrismaService, private readonly uploadRepo: UploadRepo) { }

  // ─── Shared select projection ────────────────────────────────────────────────
  categorySelectFields(user?: User): Prisma.CategoryMasterSelect {
    return {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: true,

      // remove these unless you explicitly need raw IDs
      // createdBy: true,
      // updatedBy: true,

      // creator
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          images: {
            select: {
              ownerType: true,
              id: true,
              imageUrl: true,
              publicId: true,
            },
            where: { ownerType: ImageOwnerType.USER },
          },
        },
      },

      // updater (only for admin)
      ...(user?.role === 'ADMIN' && {
        updater: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            images: {
              select: {
                ownerType: true,
                id: true,
                imageUrl: true,
                publicId: true,
              },
              where: { ownerType: ImageOwnerType.USER },
            },
          },
        },
      }),

      images: {
        select: { ownerType: true, imageUrl: true, publicId: true },
        where: {
          ownerType: { in: [ImageOwnerType.CATEGORY_IMAGE, ImageOwnerType.CATEGORY_BANNER] },
        },
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
        const createdCategories: any[] = [];

        for (const d of data) {
          const { bannerimage, categoryImage, ...rest } = d;

          const category = await this.prismaService.categoryMaster.create({
            data: {
              ...rest,
              createdBy: userId,
              updatedBy: userId,
            },
            select: this.categorySelectFields(),
          });

          // attach images immediately (no mismatch possible)
          if (bannerimage) {
            await this.uploadRepo.addImages(
              category.id,
              [bannerimage],
              ImageOwnerType.CATEGORY_BANNER
            );
          }

          if (categoryImage) {
            await this.uploadRepo.addImages(
              category.id,
              [categoryImage],
              ImageOwnerType.CATEGORY_IMAGE
            );
          }

          createdCategories.push(category);
        }
        return createdCategories;
      } else {
        const { bannerimage, categoryImage, ...categoryData } =
          data as CreateItemCategoryDto;
        return await this.prismaService.categoryMaster.create({
          data: { ...categoryData, createdBy: userId, updatedBy: userId },
          select: this.categorySelectFields(),
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
        select: this.categorySelectFields(),
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }

  async updateCategory(id: string, data: UpdateItemCategoryDto, user: User) {
    try {
      const { bannerimage, categoryImage, deletedImagePublicIds, ...categoryData } = data;

      const category = await this.prismaService.categoryMaster.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Category not found for update',
        });
      }
      const result = await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data: {...categoryData, updatedBy: user.id},
        select: this.categorySelectFields(user),
      });
      if (deletedImagePublicIds && deletedImagePublicIds.length > 0) {
        await this.uploadRepo.deleteImages(deletedImagePublicIds);
      }

      if (bannerimage) {
        await this.uploadRepo.addImages(
          id,
          [bannerimage],
          ImageOwnerType.CATEGORY_BANNER
        );
      }

      if (categoryImage) {
        await this.uploadRepo.addImages(
          id,
          [categoryImage],
          ImageOwnerType.CATEGORY_IMAGE
        );
      }

      return result;
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
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data: { isActive: false },
        select: this.categorySelectFields(),
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }

  async getAllCategories(paginatinObject: IPagination, user?: User, where?: Prisma.CategoryMasterWhereInput) {
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
          select: this.categorySelectFields(user),
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
          select: this.categorySelectFields(),
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
