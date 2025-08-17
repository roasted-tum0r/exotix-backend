import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ItemCategoryRepo } from './item-categories.repository';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';

@Injectable()
export class ItemCategoriesService {
  constructor(private readonly itemCategoriesRepo: ItemCategoryRepo) {}
  // ✅ Add new categories
  async addCategory(
    data: CreateItemCategoryDto | CreateItemCategoryDto[],
    user: User,
  ) {
    try {
      const payload = await this.itemCategoriesRepo.addCategory(data, user.id);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Categories were created',
        data: Array.isArray(payload)
          ? payload.map((r) => ({
              ...r,
            }))
          : {
              ...payload,
            },
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
  async getAllCategories(paginatinObject: IPagination) {
    try {
      const payload = await this.itemCategoriesRepo.getAllCategories({
        ...paginatinObject,
        page: paginatinObject.page ?? 1,
        limit: paginatinObject.limit ?? 100,
        isAsc: paginatinObject.isAsc ?? true,
        sortBy: paginatinObject.sortBy ?? '',
      });
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
  async updateCategory(id: number, data: UpdateItemCategoryDto) {
    try {
      const payload = await this.getCategoryById(id); // check if exists
      if (payload) {
        const updatedRecord = await this.itemCategoriesRepo.updateCategory(
          id,
          data,
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
  async getCategoryById(id: number) {
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
  async deleteCategory(id: number) {
    try {
      const category = await this.itemCategoriesRepo.getCategoryById(id);
      if (!category) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Category with ID ${id} not found.`,
        });
      } // check if exists
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
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deleting category.',
      });
    }
  }
}
