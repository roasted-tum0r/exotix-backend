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
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { SearchItemDto } from './dto/filter-item.dto';
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
  @Post('/delete')
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
}
