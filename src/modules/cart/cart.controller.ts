import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Query,
  HttpException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto, GetCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { AppLogger } from 'src/common/utils/app.logger';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Public('addToCart')
  @Post('/add-to-cart')
  async addToCart(@Body() createCart: CreateCartDto) {
    try {
      return await this.cartService.addToCartService(createCart);
    } catch (error: any) {
      AppLogger.error(`Failed add items to cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed add items to cart',
      });
    }
  }
  @Public('getCart')
  @Get()
  async getCart(
    @Query('userId') userId: string,
    @Query('isGuestCart') isGuestCart: string,
  ) {
    try {
      return await this.cartService.getCartService(
        {
          userId,
        },
        isGuestCart === 'true',
      );
    } catch (error: any) {
      AppLogger.error(`Failed to get cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get cart',
      });
    }
  }
  @Public('getCartShortInfo')
  @Get('/cart-info')
  async getCartShortInfo(
    @Query('cartId') cartId: string,
    @Query('userId') userId: string,
    @Query('isGuestCart') isGuestCart: string,
  ) {
    try {
      return await this.cartService.finalCartCountService({
        cartId,
        userId,
        isGuestCart: isGuestCart === 'true',
      });
    } catch (error: any) {
      AppLogger.error(`Failed fetch data of cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed fetch data of cart',
      });
    }
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  @Patch('/merge-cart')
  async mergeCart(
    @Query('guestUserId') guestUserId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.cartService.mergeCartupdate(guestUserId, user);
    } catch (error: any) {
      AppLogger.error(`Failed fetch data of cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed fetch data of cart',
      });
    }
  }
  @Public('deletecartpubliccall')
  @Delete('/delete-all')
  async remove(
    @Query('cartId') cartId: string,
    @Body() body: { itemIds: string[] },
    @CurrentUser() user: User,
  ) {
    try {
      return await this.cartService.remove(cartId, body?.itemIds ?? []);
    } catch (error: any) {
      AppLogger.error(`Failed cart delete`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed cart delete',
      });
    }
  }
}
