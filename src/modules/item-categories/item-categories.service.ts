import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ItemCategoryRepo } from './item-categories.repository';
import { ImageOwnerType, Prisma, User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';
import { UploadRepo } from '../image-upload/upload.repo';
import { CloudinaryService } from 'src/config/cloudinary/cloudinary.service';

@Injectable()
export class ItemCategoriesService {
  constructor(
    private readonly itemCategoriesRepo: ItemCategoryRepo,
    private readonly uploadRepo: UploadRepo,
    private readonly cloudinaryService: CloudinaryService
  ) { }
  // ✅ Add new categories
  async addCategory(
    data: CreateItemCategoryDto[],
    user: User,
  ) {
    try {
      const payload = await this.itemCategoriesRepo.addCategory(data, user.id);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Categories were created',
        data: Array.isArray(payload)
          ? payload.map((r) => ({ ...r }))
          : { ...payload },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while creating category.',
      });
    }
  }
  // ✅ Add new categories
  async searchCategories(searchObject: ISearchObject | IPagination) {
    try {
      let payload;

      if ('searchText' in searchObject && searchObject.searchText?.trim()) {
        // Search mode
        payload = await this.itemCategoriesRepo.searchCategory(searchObject);
        payload = {
          ...payload,
          currentPage: searchObject.page,
          totalPages: Math.ceil(payload.total / searchObject.limit),
        };
      } else {
        // Normal list mode
        payload = await this.itemCategoriesRepo.getAllCategories(searchObject);
      }
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Categories were created',
        data: {
          ...payload,
          results: payload.results.map((r) => ({
            ...r,
          })),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while searching category.',
      });
    }
  }
  // ✅ Get all categories
  async getAllCategories(paginatinObject: ISearchObject, user?: User) {
    try {
      const isPrivileged = user?.role === 'ADMIN' || user?.role === 'EMPLOYEE';
      const where = this.buildCategoryWhere(paginatinObject, isPrivileged);
      console.log("SEARCH TEXT:", paginatinObject.searchText);
      console.log("WHERE:", JSON.stringify(where, null, 2));
      const payload = await this.itemCategoriesRepo.getAllCategories({
        ...paginatinObject,
        page: paginatinObject.page ?? 1,
        limit: paginatinObject.limit ?? 100,
        isAsc: paginatinObject.isAsc ?? true,
        sortBy: paginatinObject.sortBy ?? '',
      }, user, where);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Categories were fetched',
        data: {
          ...payload,
          results: payload.results.map((r) => ({
            ...r,
          })),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching categories.',
      });
    }
  }
  // ✅ Update category by ID
  async updateCategory(id: string, data: UpdateItemCategoryDto, user: User) {
    try {
      const payload = await this.getCategoryById(id); // check if exists
      if (payload) {
        const updatedRecord = await this.itemCategoriesRepo.updateCategory(
          id,
          data,
          user
        );

        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: `Category: ${updatedRecord.name} was updated.`,
          data: {
            ...updatedRecord,
          },
        };
      } else
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Category not found',
        });
    } catch (error) {
      AppLogger.error('error', error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while updating category.',
      });
    }
  }
  // ✅ Get category by ID
  async getCategoryById(id: string) {
    try {
      const category = await this.itemCategoriesRepo.getCategoryById(id);
      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Category with ID ${id} not found.`,
        });
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Category: ${category.name} fetched.`,
        data: {
          ...category,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching category.',
      });
    }
  }

  // ✅ Delete category by ID
  async deleteCategory(id: string, user: User) {
    try {
      const category = await this.itemCategoriesRepo.getCategoryById(id);
      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Category with ID ${id} not found.`,
        });
      }
      // check if items exists in it
      if (category._count.items !== 0) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: true,
          message: `Category "${category.name}" has ${category._count.items} items in it, therefore cannot delete this category. Please remove all items first or move them to another category to prevent data loss.`,
          meta: {
            itemCount: category._count.items,
            categoryId: category.id,
          },
          code: "CATEGORY_HAS_ITEMS",
        });
      }
      if (user.role !== "ADMIN" && category?.user?.id !== user?.id) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: true,
          message: "You are not authorized to delete this category.",
          code: "CATEGORY_DELETE_FORBIDDEN",
        });
      }
      // 2. Image cleanup — purge from Cloudinary then from the metadata table
      const linkedImages_Cat = await this.uploadRepo.getImagesById(category.id, ImageOwnerType.CATEGORY_IMAGE);
      const linkedImages_Ban = await this.uploadRepo.getImagesById(category.id, ImageOwnerType.CATEGORY_BANNER);
      const linkedImages = [...linkedImages_Cat, ...linkedImages_Ban];
      if (linkedImages?.length) {
        const publicIds = linkedImages.map((img) => img.publicId);
        const deletedImages = await Promise.all(
          publicIds.map((id) => this.cloudinaryService.deleteImage(id)),
        );
        console.log("deletedImages ", deletedImages);
        if (deletedImages?.length > 0) {
          await this.uploadRepo.deleteImages(publicIds);
        }
      }
      const categoryDeleted = await this.itemCategoriesRepo.deleteCategory(id);

      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Category: ${categoryDeleted.name} was deleted.`,
        data: {
          ...categoryDeleted,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // preserve original error
      }

      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deleting category.',
      });
    }
  }

  // ✅ Restore (reactivate) a deactivated category
  async restoreCategory(id: string) {
    try {
      const restored = await this.itemCategoriesRepo.restoreCategory(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Category: ${restored.name} was restored.`,
        data: { ...restored },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while restoring category.',
      });
    }
  }

  // ✅ Permanently (hard) delete a category — only if it has no items
  async hardDeleteCategory(id: string) {
    try {
      // Fetch WITHOUT isActive filter so deactivated categories are also found
      const category = await this.itemCategoriesRepo.getCategoryByIdUnfiltered(id);
      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Category with ID ${id} not found.`,
        });
      }
      if (category._count.items !== 0) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: true,
          message: `Category "${category.name}" still has ${category._count.items} item(s). Move or delete all items before permanently removing this category.`,
          meta: { itemCount: category._count.items, categoryId: category.id },
          code: 'CATEGORY_HAS_ITEMS',
        });
      }
      // Clean up Cloudinary images first
      const linkedImages_Cat = await this.uploadRepo.getImagesById(category.id, ImageOwnerType.CATEGORY_IMAGE);
      const linkedImages_Ban = await this.uploadRepo.getImagesById(category.id, ImageOwnerType.CATEGORY_BANNER);
      const linkedImages = [...linkedImages_Cat, ...linkedImages_Ban];
      if (linkedImages?.length) {
        const publicIds = linkedImages.map((img) => img.publicId);
        const deletedImages = await Promise.all(
          publicIds.map((pid) => this.cloudinaryService.deleteImage(pid)),
        );
        if (deletedImages?.length > 0) {
          await this.uploadRepo.deleteImages(publicIds);
        }
      }
      await this.itemCategoriesRepo.hardDeleteCategory(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Category "${category.name}" was permanently deleted.`,
        data: { id },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while permanently deleting category.',
      });
    }
  }
  async getItemsOfCategory(id: string) {
    try {
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Category with ID ${id} not found.`,
        });
      }
      const result = await this.itemCategoriesRepo.getItemsOfCategory(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Items of category: ${category.data.name} fetched.`,
        data: {
          ...result,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // preserve original error
      }
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching items of category.',
      });
    }
  }
  // helper to build the where clause
  // isPrivileged = true means the caller is an admin or employee:
  // they can see ALL categories (active + inactive), the isActive field
  // is still returned so they know which ones need reactivation.
  private buildCategoryWhere(filters: ISearchObject, isPrivileged = false): Prisma.CategoryMasterWhereInput {
    const { searchText } = filters || {};

    // Public users always see only active categories.
    // Admins / employees see everything — no isActive filter.
    const where: Prisma.CategoryMasterWhereInput = isPrivileged ? {} : { isActive: true };

    if (searchText) {
      where.OR = [
        {
          name: {
            contains: searchText.toLowerCase(),
            // mode: 'insensitive',
          } as Prisma.StringFilter<'CategoryMaster'>,
        },
        {
          description: {
            contains: searchText.toLowerCase(),
            // mode: 'insensitive',
          } as Prisma.StringFilter<'CategoryMaster'>,
        },
      ];
    }
    return where;
  }
}
