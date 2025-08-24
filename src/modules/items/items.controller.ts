import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto } from './dto/filter-item.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { IPagination } from 'src/common/interfaces/app.interface';

@Controller('items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}
  @Roles('admin')
  @Post('/create')
  async create(
    @Body() dto: Omit<CreateItemDto, 'categoryId'>,
    @Body('categoryId', DecryptIdPipe) categoryId: number,
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
  @Public('findAllItemsWithFiters')
  @Post('/search')
  async findAll(
    // @Body() filters: FilterItemDto
    @Body() filters: Omit<FilterItemDto, 'categoryIds'>,
    @Body('categoryIds', DecryptIdPipe) categoryIds: number[],
  ) {
    try {
      return await this.service.findAll({ ...filters, categoryIds });
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to search items',
      });
    }
  }
  @Public('findAllItemsListWithPagination')
  @Post('/list')
  async getAllItems(@Body() paginationObject: IPagination) {
    try {
      return await this.service.getAllItemsService(paginationObject);
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
  async findOne(@Param('id', DecryptIdPipe) id: number) {
    try {
      return await this.service.findOne(+id);
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
    @Param('id', DecryptIdPipe) id: number,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.update(+id, dto, user);
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
  async remove(@Body('id', DecryptIdPipe) id: number) {
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
}
