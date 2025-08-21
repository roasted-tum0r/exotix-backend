import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartRepository } from './cart.repository';
import { ItemsRepository } from '../items/items.repository';
import { User } from '@prisma/client';
import { CartItemsRepository } from '../cart-items/cart-items.repository';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemsRepository: CartItemsRepository,
    private readonly itemRepository: ItemsRepository,
  ) {}
  async addToCartService(createCartDto: CreateCartDto, user: User) {
    try {
      // const checkExistingCart = await this.cartRepository.getOrCreateCart(
      //   user.id,
      //   user.firstname,
      // );
      // await this.cartItemsRepository.addCartItem(
      //   user.id,
      //   createCartDto.itemId,
      //   checkExistingCart.id,
      //   {
      //     cartId: checkExistingCart.id,
      //     itemId: createCartDto.itemId,
      //   },
      // );
      const addToCartCalls = await this.cartRepository.getOrCreateCartOrItem(
        user.id,
        createCartDto.itemId,
        user.firstname,
      );
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item added to cart',
        data: {
          cartCount: addToCartCalls.cartCount,
          addedItems: addToCartCalls.addedItems,
        },
      };
      // const newCartItem = await this.cartItemsRepository.addCartItem()
      //if cart doesnt exist we create a new cart and add the item to it so we call one from cart repo one from cat item repo both to create
      // Reminder: Need to create a bulk item discount update call in item module
    } catch (error) {
      AppLogger.error(`Failed add to cart`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add to cart',
      });
    }
  }

  async getCartService(user: User) {
    try {
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Cart fetched',
        data: await this.cartRepository.getCartByUserID(user.id),
      };
    } catch (error) {}
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
