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
      const newPayload = Array.isArray(payload)
        ? payload.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }))
        : {
            ...payload,
            createdAt: payload.createdAt.toISOString(),
            updatedAt: payload.updatedAt.toISOString(),
          };
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Categories were created',
        data: newPayload,
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while creating category.',
      });
    }
  }

  // ✅ Get all categories
  async getAllCategories() {
    try {
      const payload = (await this.itemCategoriesRepo.getAllCategories()).map(
        (r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }),
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Categories were fetched',
        data: payload,
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
            createdAt: updatedRecord.createdAt.toISOString(),
            updatedAt: updatedRecord.updatedAt.toISOString(),
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
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
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
      const categoryDeleted=await this.itemCategoriesRepo.deleteCategory(id);
      return {
          statusCode: HttpStatus.OK,
          error: false,
          message: `Category: ${categoryDeleted.name} was deleted.`,
          data: {
            ...categoryDeleted,
            createdAt: categoryDeleted.createdAt.toISOString(),
            updatedAt: categoryDeleted.updatedAt.toISOString(),
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
