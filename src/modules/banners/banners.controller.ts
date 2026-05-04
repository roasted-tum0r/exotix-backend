import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { User } from '@prisma/client';
import { IPagination } from 'src/common/interfaces/app.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OptionalAuthGuard } from 'src/auth/optionalguards/optional-auth.guard';
import { ISearchObject } from 'src/common/interfaces/category.interface';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @Roles('admin', 'employee')
  async create(
    @Body() createBannerDto: CreateBannerDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.bannersService.create(createBannerDto, user.id);
    } catch (error) {
      AppLogger.error('Failed to create banner', error.stack);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create banner',
      });
    }
  }

  @Public('Banners.findAll')
  @UseGuards(OptionalAuthGuard)
  @Post('findall')
  async findAll(
    @Body() paginationObject: Omit<ISearchObject, 'isAsc'>,
    @Body('isAsc') isAsc: string,
    @CurrentUser() user?: User,
  ) {
    try {
      const pagination: ISearchObject = {
        ...paginationObject,
        page: +(paginationObject.page ?? 1),
        limit: +(paginationObject.limit ?? 10),
        sortBy: paginationObject.sortBy ?? 'priority',
        isAsc: isAsc === 'true',
      };
      return await this.bannersService.findAll(pagination, user);
    } catch (error) {
      AppLogger.error('Failed to fetch banners', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch banners',
      });
    }
  }

  @Public('Banners.findOne')
  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    try {
      return await this.bannersService.findOne(id, user);
    } catch (error) {
      AppLogger.error(`Failed to fetch banner with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch banner',
      });
    }
  }

  @Patch(':id')
  @Roles('admin', 'employee')
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.bannersService.update(
        id,
        updateBannerDto,
        user.id,
        user,
      );
    } catch (error) {
      AppLogger.error(`Failed to update banner with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to update banner',
      });
    }
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    try {
      return await this.bannersService.remove(id);
    } catch (error) {
      AppLogger.error(`Failed to delete banner with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete banner',
      });
    }
  }

  @Delete('deactivate/:id')
  @Roles('admin', 'employee')
  async deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      return await this.bannersService.deactivate(id, user.id);
    } catch (error) {
      AppLogger.error(`Failed to deactivate banner with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to deactivate banner',
      });
    }
  }

  @Patch('restore/:id')
  @Roles('admin', 'employee')
  async restore(@Param('id') id: string, @CurrentUser() user: User) {
    try {
      return await this.bannersService.restore(id, user.id);
    } catch (error) {
      AppLogger.error(`Failed to restore banner with id ${id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to restore banner',
      });
    }
  }

  @Delete('hard-delete/:id')
  @Roles('admin')
  async hardDelete(@Param('id') id: string) {
    try {
      return await this.bannersService.hardDelete(id);
    } catch (error) {
      AppLogger.error(
        `Failed to hard-delete banner with id ${id}`,
        error.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to permanently delete banner',
      });
    }
  }

  @Patch(':id/toggle-ongoing')
  @Roles('admin', 'employee')
  async toggleOngoing(
    @Param('id') id: string,
    @Body('isOngoing') isOngoing: boolean,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.bannersService.toggleOngoing(id, isOngoing, user.id);
    } catch (error) {
      AppLogger.error(
        `Failed to toggle banner ongoing status for id ${id}`,
        error.stack,
      );
      if (error instanceof HttpException) throw error;
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to toggle banner status',
      });
    }
  }
}
