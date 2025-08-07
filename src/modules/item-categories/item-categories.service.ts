import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { ItemCategoryRepo } from './item-categories.repository';

@Injectable()
export class ItemCategoriesService {
  constructor(private readonly itemCategoriesRepo: ItemCategoryRepo) {}
  // ✅ Add new categories
  async addCategory(data: CreateItemCategoryDto | CreateItemCategoryDto[]) {
    try {
      return await this.itemCategoriesRepo.addCategory(data);
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
      return await this.itemCategoriesRepo.getAllCategories();
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching categories.',
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
      return category;
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching category.',
      });
    }
  }

  // ✅ Update category by ID
  async updateCategory(id: number, data: UpdateItemCategoryDto) {
    try {
      await this.getCategoryById(id); // check if exists
      return await this.itemCategoriesRepo.updateCategory(id, data);
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while updating category.',
      });
    }
  }

  // ✅ Delete category by ID
  async deleteCategory(id: number) {
    try {
      await this.getCategoryById(id); // check if exists
      return await this.itemCategoriesRepo.deleteCategory(id);
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deleting category.',
      });
    }
  }
}
