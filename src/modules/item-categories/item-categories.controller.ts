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
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';
import { AppLogger } from 'src/common/utils/app.logger';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { IPagination } from 'src/common/interfaces/app.interface';
import { OptionalAuthGuard } from 'src/auth/optionalguards/optional-auth.guard';

@Controller('item-categories')
export class ItemCategoriesController {

  constructor(private readonly itemCategoriesService: ItemCategoriesService) { }
  @Roles('admin')
  @Post()
  async create(
    @Body() createItemCategoryDto: CreateItemCategoryDto[],
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
    @Param('id') id: string,
    @Body() updateItemCategoryDto: UpdateItemCategoryDto,
    @CurrentUser() user: User,
  ) {
    try {
      const result = await this.itemCategoriesService.updateCategory(
        id,
        updateItemCategoryDto,
        user,
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
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update category',
      });
    }
  }
  // @Roles('admin')
  // @Patch('/activate/:id')
  // async activate(@Param('id') id: string) {
  //   try {
  //     return await this.itemCategoriesService.activateCategory(id);
  //   } catch (error) {
  //     AppLogger.error(`Failed to activate category with id ${id}`, error.stack);
  //     if (error instanceof HttpException) throw error;
  //     throw new InternalServerErrorException({
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: 'Failed to activate category',
  //     });
  //   }
  // }
  @Public('findallcategories')
  @UseGuards(OptionalAuthGuard)
  @Post('/findall')
  async findAll(
    @Body() paginationObject: Omit<ISearchObject, 'isAsc'>,
    @Body('isAsc') isAsc: string,
    @CurrentUser() user?: User,
  ) {
    try {
      return await this.itemCategoriesService.getAllCategories({
        ...paginationObject,
        isAsc: isAsc === 'true',
      }, user);
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
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.itemCategoriesService.getCategoryById(id);
      if (!result) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Category not found',
        });
      }
      return result;
    } catch (error) {
      AppLogger.error(`Failed to fetch category with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch category',
      });
    }
  }
  @Roles('admin','employee')
  @Delete('/deactivate/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      return await this.itemCategoriesService.deleteCategory(id, user);
    } catch (error) {
      AppLogger.error(`Failed to delete category with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete category',
      });
    }
  }
  @Public('searchCategory')
  @Post('/search')
  async search(@Body() searchObject: ISearchObject | IPagination) {
    try {
      return this.itemCategoriesService.searchCategories(searchObject);
    } catch (error) {
      AppLogger.error(`Failed search`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete category',
      });
    }
  }
}
