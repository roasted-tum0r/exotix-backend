import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DeleteAddressDto } from './dto/delete-address.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { IPagination } from 'src/common/interfaces/app.interface';

@Controller('addresses')
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Post('/create')
  async create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return await this.service.create(user, dto);
  }

  @Get('/list')
  async findMany(@CurrentUser() user: User, @Query() pagination: IPagination) {
    return await this.service.findMany(user, pagination);
  }

  @Get('/get-one')
  async findById(@Query('addressId') addressId: string) {
    return await this.service.findById(addressId);
  }

  @Patch('/update')
  async update(
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return await this.service.update(addressId, dto);
  }

  @Delete()
  async delete(@Body() dto: DeleteAddressDto) {
    return await this.service.delete(dto);
  }
}
