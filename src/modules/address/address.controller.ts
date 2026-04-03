import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DeleteAddressDto } from './dto/delete-address.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('addresses')
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Post('/create')
  async create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    try {
      return await this.service.create(user, dto);
    } catch (error: any) {
      AppLogger.error(`Failed create address`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed create address',
      });
    }
  }

  @Get('/list')
  async findMany(@CurrentUser() user: User, @Query() pagination: IPagination) {
    try {
      return await this.service.findMany(user, pagination as IPagination);
    } catch (error: any) {
      AppLogger.error(`Failed address fetch`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed address fetch',
      });
    }
  }

  @Get('/get-one')
  async findById(@Query('addressId') addressId: string) {
    try {
      return await this.service.findById(addressId);
    } catch (error: any) {
      AppLogger.error(`Failed to get one address`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get one address',
      });
    }
  }

  @Patch('/update')
  async update(
    @Query('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    try {
      return await this.service.update(addressId, dto);
    } catch (error: any) {
      AppLogger.error(`Failed update address`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed update address',
      });
    }
  }

  @Delete('/delete')
  async delete(@Body() dto: DeleteAddressDto) {
    try {
      return await this.service.delete(dto);
    } catch (error: any) {
      AppLogger.error(`Failed to delete addresses`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete addresses',
      });
    }
  }
}
