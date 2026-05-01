import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpStatus,
  InternalServerErrorException,
  HttpException,
  Delete,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { RecommendationPaginationDto, SearchItemDto } from './dto/filter-item.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}
  @Roles('admin')
  @Post('/create')
  async create(
    @Body() dto: Omit<CreateItemDto, 'categoryId'>,
    @Body('categoryId') categoryId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.create({ ...dto, categoryId }, user);
    } catch (error) {
      AppLogger.error(`Failed create item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create item',
      });
    }
  }
  @Public('itemSuggestions')
  @Get('/suggestions')
  async getSuggestions(@Query('search') search?: string) {
    try {
      return await this.service.getSuggestionsService(search);
    } catch (error) {
      AppLogger.error(`Failed to fetch item suggestions`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch item suggestions',
      });
    }
  }

  @Public('findAllItemsListWithPagination')
  @Get('/list')
  async getAllItems(@Query() filterObject: SearchItemDto) {
    try {
      return await this.service.getAllItemsService(filterObject);
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to search items',
      });
    }
  }
  @Public('itemDetails')
  @Get('/details/:id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.service.findOne(id);
    } catch (error) {
      AppLogger.error(`Failed fetch item details`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch item details',
      });
    }
  }
  @Roles('admin')
  @Patch('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.update(id, dto, user);
    } catch (error) {
      AppLogger.error(`Failed update item details`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update item details',
      });
    }
  }
  @Roles('admin')
  @Delete('/delete')
  async remove(@Body('id') id: string) {
    try {
      return await this.service.remove(id);
    } catch (error) {
      AppLogger.error(`Failed delete item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete item',
      });
    }
  }
  @Roles('admin','employee')
  @Post('/move')
  async moveItems(@Body('itemIds') itemIds: string[], @Body('categoryId') categoryId: string,) {
    try {
      return await this.service.moveItems(itemIds,categoryId);
    } catch (error) {
      AppLogger.error(`Failed move items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete item',
      });
    }
  }
    @Roles('admin','employee')
  @Delete('/deletebycategory/:categoryId')
  async deleteByCategory(@Param('categoryId') categoryId: string,) {
    try {
      return await this.service.deleteByCategory(categoryId);
    } catch (error) {
      AppLogger.error(`Failed delete by category items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete item',
      });
    }
  }

  @Post('/favourite')
  async addToFavourite(
    @Query('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.addToFavourite(user.id, itemId);
    } catch (error) {
      AppLogger.error(`Failed to add item to favourites`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add item to favourites',
      });
    }
  }

  @Post('/wishlist')
  async addToWishlist(
    @Query('itemId') itemId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.addToWishlist(user.id, itemId);
    } catch (error) {
      AppLogger.error(`Failed to add item to wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add item to wishlist',
      });
    }
  }

  /**
   * GET /items/details/:id/similar?page=1&limit=6&sortBy=rating&isAsc=false
   * Publicly fetch items in the same category as the given item.
   * Section label: "Similar Items"
   */
  @Public('similarItems')
  @Get('/details/:id/similar')
  async getSimilarItems(
    @Param('id') id: string,
    @Query() pagination: RecommendationPaginationDto,
  ) {
    try {
      return await this.service.getSimilarItems(id, pagination);
    } catch (error) {
      AppLogger.error(`Failed to fetch similar items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch similar items',
      });
    }
  }

  /**
   * GET /items/details/:id/also-like?page=1&limit=6&sortBy=price&isAsc=true
   * Publicly fetch items in a ±30% price range.
   * Section label: "Items You May Like"
   */
  @Public('alsoLikeItems')
  @Get('/details/:id/also-like')
  async getAlsoLikeItems(
    @Param('id') id: string,
    @Query() pagination: RecommendationPaginationDto,
  ) {
    try {
      return await this.service.getAlsoLikeItems(id, pagination);
    } catch (error) {
      AppLogger.error(`Failed to fetch also-like items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch items you may like',
      });
    }
  }

  /**
   * GET /items/details/:id/also-bought?page=1&limit=6&sortBy=name&isAsc=true
   * Publicly fetch items co-purchased with the given item, ranked by frequency.
   * Section label: "People Also Bought"
   */
  @Public('alsoBoughtItems')
  @Get('/details/:id/also-bought')
  async getAlsoBoughtItems(
    @Param('id') id: string,
    @Query() pagination: RecommendationPaginationDto,
  ) {
    try {
      return await this.service.getAlsoBoughtItems(id, pagination);
    } catch (error) {
      AppLogger.error(`Failed to fetch also-bought items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch people also bought',
      });
    }
  }
}
