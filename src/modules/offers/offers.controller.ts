import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { BulkIdsDto } from './dto/bulk-ids.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { FindOfferDto } from './dto/find-offer.dto';
import { Roles } from 'src/common/decorators/user-role.decorator';

@Controller('offers')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OffersController {
  constructor(private readonly offersService: OffersService) {}
  @Roles('admin')
  @Post('/create')
  async create(@Body() createDto: CreateOfferDto, @CurrentUser() user: User) {
    try {
      return await this.offersService.create(createDto, user);
    } catch (error) {
      AppLogger.error('Controller create failed', error as any);
      throw error;
    }
  }
  @Roles('admin')
  @Get('/find-all')
  async findAll(@Query() findOffer: FindOfferDto) {
    try {
      return await this.offersService.findAll(findOffer);
    } catch (error) {
      AppLogger.error('Controller findAll failed', error as any);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Query('id') id: string) {
    try {
      const offer = await this.offersService.findById(id);
      return { data: offer };
    } catch (error) {
      AppLogger.error(`Controller findOne failed for ${id}`, error as any);
      throw error;
    }
  }

  @Patch(':id')
  async update(
    @Query('id') id: string,
    @Body() updateDto: UpdateOfferDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.offersService.update(id, updateDto, user);
    } catch (error) {
      AppLogger.error(`Controller update failed for ${id}`, error as any);
      throw error;
    }
  }

  // Bulk delete
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteMany(@Body() bulkDto: BulkIdsDto) {
    try {
      const result = await this.offersService.deleteMany(bulkDto.ids);
      return { message: `Deleted ${result.count} offers`, count: result.count };
    } catch (error) {
      AppLogger.error('Controller deleteMany failed', error as any);
      throw error;
    }
  }

  // Bulk deactivate
  @Patch('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateMany(@Body() body: BulkIdsDto, @CurrentUser() user: User) {
    try {
      // validate body minimally here (you can also create DTO for it)
      return await this.offersService.deactivateMany(body.ids, user.id);
    } catch (error) {
      AppLogger.error('Controller deactivateMany failed', error as any);
      throw error;
    }
  }
}
