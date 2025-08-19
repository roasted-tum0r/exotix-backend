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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { AppLogger } from 'src/common/utils/app.logger';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('/add-to-cart')
  async addToCart(
    @Body('itemIds', DecryptIdPipe) itemIds: number[],
    @CurrentUser() user: User,
  ) {
    try {
      return await this.cartService.addToCartService({ itemIds }, user);
    } catch (error) {
      AppLogger.error(`Failed add items to cart`, error.stack);
      if (error instanceof Error) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed add items to cart',
      });
    }
  }

  @Get('/cart')
  async getCart(@CurrentUser() user: User) {
    try {
      return await this.cartService.getCartService(user);
    } catch (error) {
      AppLogger.error(`Failed to get cart`, error.stack);
      if (error instanceof Error) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get cart',
      });
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }
}
