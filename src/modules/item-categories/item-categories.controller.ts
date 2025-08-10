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
import { Roles } from 'src/common/decorators/user-role.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('item-categories')
export class ItemCategoriesController {
  private readonly logger = new Logger(ItemCategoriesController.name);

  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}
  @Roles('admin')
  @Post()
  async create(
    @Body() createItemCategoryDto: CreateItemCategoryDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.itemCategoriesService.addCategory(
        createItemCategoryDto,
        user,
      );
    } catch (error) {
      AppLogger.error('Failed to create category', error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create category',
      });
    }
  }
  @Roles('admin')
  @Patch('/update/:id')
  async update(
    @Param('id', DecryptIdPipe) id: number,
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
      AppLogger.error(`Failed to update category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update category',
      });
    }
  }
  @Public('findallcategories')
  @Get()
  async findAll() {
    try {
      return await this.itemCategoriesService.getAllCategories();
    } catch (error) {
      AppLogger.error('Failed to fetch categories', error.stack);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch categories',
      });
    }
  }
  @Public('findOnecategory')
  @Get('/getone/:id')
  async findOne(@Param('id', DecryptIdPipe) id: number,) {
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
      AppLogger.error(`Failed to fetch category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch category',
      });
    }
  }
  @Roles('admin')
  @Delete('/deactivate/:id')
  async remove(@Param('id', DecryptIdPipe) id: number,) {
    try {
      
      return await this.itemCategoriesService.deleteCategory(+id);
    } catch (error) {
      AppLogger.error(`Failed to delete category with id ${id}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete category',
      });
    }
  }
}
