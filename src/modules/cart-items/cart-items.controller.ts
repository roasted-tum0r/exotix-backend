import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('cart-items')
export class CartItemsController {
  constructor(private readonly cartItemsService: CartItemsService) {}

  @Post()
  create(@Body() createCartItemDto: CreateCartItemDto) {
    return this.cartItemsService.create(createCartItemDto);
  }

  @Get()
  findAll() {
    return this.cartItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartItemsService.findOne(+id);
  }
  @Public('updateCartItem')
  @Patch('/update')
  async update(
    @Query('itemId') itemId: string,
    @Query('userId') userId: string,
    @Query('isGuestCart') isGuestCart: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    try {
      return await this.cartItemsService.update(
        itemId,
        updateCartItemDto,
        userId,
        isGuestCart === 'true',
      );
    } catch (error) {
      AppLogger.error(`Failed edit items of cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed edit items of cart',
      });
    }
  }
  @Public('deleteCartItem')
  @Delete('/delete')
  async remove(
    @Query('itemId') itemId: string,
    @Query('userId') userId: string,
    @Query('isGuestCart') isGuestCart: string,
    @Body('cartId') cartId: string,
  ) {
    try {
      return await this.cartItemsService.remove(
        itemId,
        cartId,
        userId,
        isGuestCart === 'true',
      );
    } catch (error) {
      AppLogger.error(`Failed edit items of cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed edit items of cart',
      });
    }
  }
}
