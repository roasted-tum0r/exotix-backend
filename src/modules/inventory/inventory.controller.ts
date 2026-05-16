import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { Post } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/role-auth.guard';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@Controller('inventory')
@UseGuards(RolesGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) { }

  @Roles('admin', 'employee')
  @Patch('/update')
  async updateStock(
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.updateStock(dto, user);
    } catch (error) {
      AppLogger.error(`Failed to update inventory`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update inventory record',
      });
    }
  }

  @Roles('admin', 'employee')
  @Post('/transfer')
  async transferStock(
    @Body() dto: TransferInventoryDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.service.transferStock(dto, user);
    } catch (error) {
      AppLogger.error(`Failed to transfer stock`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to transfer stock between branches',
      });
    }
  }

  @Roles('admin', 'employee')
  // @ApiOperation({ summary: 'Get all inventory records with filters (Admin/Employee only)' })
  @Get('/list')
  async getInventoryList(@Query() filters: FilterInventoryDto) {
    try {
      return await this.service.getInventoryList(filters);
    } catch (error) {
      AppLogger.error(`Failed to fetch inventory list`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch inventory records',
      });
    }
  }

  @Roles('admin', 'employee')
  // @ApiOperation({ summary: 'Get specific inventory record (Admin/Employee only)' })
  @Get('/:itemId/:branchId')
  async getInventoryItem(
    @Param('itemId') itemId: string,
    @Param('branchId') branchId: string,
  ) {
    try {
      return await this.service.getInventoryItem(itemId, branchId);
    } catch (error) {
      AppLogger.error(`Failed to fetch inventory item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch inventory record',
      });
    }
  }
}
