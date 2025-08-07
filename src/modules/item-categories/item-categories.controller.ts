import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';

@Controller('item-categories')
export class ItemCategoriesController {
  private readonly logger = new Logger(ItemCategoriesController.name);

  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  @Post()
  async create(@Body() createItemCategoryDto: CreateItemCategoryDto) {
    try {
      return await this.itemCategoriesService.addCategory(
        createItemCategoryDto,
      );
    } catch (error) {
      this.logger.error('Failed to create category', error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create category',
      });
    }
  }

  @Patch('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateItemCategoryDto: UpdateItemCategoryDto,
  ) {
    try {
      const result = await this.itemCategoriesService.updateCategory(
        +id,
        updateItemCategoryDto,
      );
      if (!result) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Category not found for update',
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`Failed to update category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update category',
      });
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.itemCategoriesService.getAllCategories();
    } catch (error) {
      this.logger.error('Failed to fetch categories', error.stack);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch categories',
      });
    }
  }

  @Get('/getone/:id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.itemCategoriesService.getCategoryById(+id);
      if (!result) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Category not found',
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch category',
      });
    }
  }

  @Delete(':/deactivate/id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.itemCategoriesService.deleteCategory(+id);
      if (!result) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Category not found for deletion',
        });
      }
      return { message: 'Category deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete category',
      });
    }
  }
}
