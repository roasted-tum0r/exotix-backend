import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { CartItemsRepository } from './cart-items.repository';
import { User } from '@prisma/client';
import { ItemsRepository } from '../items/items.repository';

@Injectable()
export class CartItemsService {
  constructor(
    private readonly cartItemRepository: CartItemsRepository,
    private readonly itemRepository: ItemsRepository,
  ) {}
  create(createCartItemDto: CreateCartItemDto) {
    return 'This action adds a new cartItem';
  }

  findAll() {
    return `This action returns all cartItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cartItem`;
  }

  async update(id: number, updateCartItemDto: UpdateCartItemDto, user: User) {
    try {
      const verifyItem = await this.itemRepository.addItemDetails(id);
      if (!verifyItem || !verifyItem.isAvailable)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Sorry! This item is no longer available for ordering.',
        });
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item updated in cart',
        data: {
          updatedItem: await this.cartItemRepository.editCartItem(
            user.id,
            id,
            updateCartItemDto,
          ),
        },
      };
    } catch (error) {
      AppLogger.error(`Cart item update`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Cart item update failed',
      });
    }
  }

  async remove(id: number, cartId: number, user: User) {
    try {
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item deleted from cart',
        data: {
          updatedItem: await this.cartItemRepository.deleteCartItem(
            user.id,
            id,
            cartId,
          ),
        },
      };
    } catch (error) {
      AppLogger.error(`Cart item delete failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Cart item delete failed',
      });
    }
  }
}
