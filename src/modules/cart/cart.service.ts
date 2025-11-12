import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto, GetCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartRepository } from './cart.repository';
import { ItemsRepository } from '../items/items.repository';
import { User } from '@prisma/client';
import { CartItemsRepository } from '../cart-items/cart-items.repository';
import { AppLogger } from 'src/common/utils/app.logger';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../auth/auth.repository';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly userRepository: UserRepository,
    private readonly itemRepository: ItemsRepository,
  ) {}
  async addToCartService(createCartDto: CreateCartDto) {
    try {
      const verifyItem = await this.itemRepository.addItemDetails(
        createCartDto.itemId,
      );
      if (!verifyItem || !verifyItem.isAvailable)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'This item is no longer available for ordering.',
        });
      if (createCartDto.isGuestCart) {
        const userId = createCartDto.userId ?? uuidv4();
        const addToCartCalls = await this.cartRepository.getOrCreateCartOrItem(
          userId,
          createCartDto.itemId,
          `Guest cart: ${userId}`,
          createCartDto.isGuestCart,
        );
        return {
          statusCode: HttpStatus.CREATED,
          error: false,
          message: 'Item added to cart',
          data: {
            cartId: addToCartCalls.cart.id,
            guestUserId: userId,
          },
        };
      } else {
        let user: User | null;
        if (createCartDto.userId) {
          user = await this.userRepository.findByUserId(createCartDto.userId);
        } else
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: true,
            message: 'User id required for this call when logged in.',
          });
        if (!user)
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: true,
            message: 'User not found!',
          });
        const addToCartCalls = await this.cartRepository.getOrCreateCartOrItem(
          user?.id!,
          createCartDto.itemId,
          user?.firstname!,
          createCartDto.isGuestCart,
        );
        return {
          statusCode: HttpStatus.CREATED,
          error: false,
          message: 'Item added to cart',
          data: {
            cartId: addToCartCalls.cart.id,
          },
        };
      }

      // const newCartItem = await this.cartItemsRepository.addCartItem()
      //if cart doesnt exist we create a new cart and add the item to it so we call one from cart repo one from cat item repo both to create
      // Reminder: Need to create a bulk item discount update call in item module
    } catch (error) {
      AppLogger.error(`Failed add to cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add to cart',
      });
    }
  }

  async getCartService(getCart: GetCartDto, isGuestCart: boolean) {
    try {
      if (getCart.userId) {
        // If userId is present, we can fetch the cart
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Cart fetched',
          data: await this.cartRepository.getCartByUserID(
            getCart.userId,
            isGuestCart,
          ),
        };
      } else {
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Cart fetched',
          data: null,
        };
      }
    } catch (error) {
      AppLogger.error(`Failed get cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get cart',
      });
    }
  }
  async finalCartCountService({
    cartId,
    userId,
    isGuestCart,
  }: {
    cartId: string;
    userId: string;
    isGuestCart: boolean;
  }) {
    try {
      const finalItemCount = await this.cartRepository.getFinalCartCount(
        userId,
        cartId,
        isGuestCart,
      );
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Items which are added to cart',
        data: {
          cartCount: finalItemCount.cartItemCount,
          addedItems: finalItemCount.addedItems,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed get cart short info`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to cart short info',
      });
    }
  }
  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  async mergeCartupdate(guestUserId: string, user: User) {
    try {
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Carts merged',
        data: await this.cartRepository.mergeCart(
          user.id,
          guestUserId,
          user.firstname,
        ),
      };
    } catch (error) {}
  }

  async remove(id: string) {
    try {
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Cart was deleted',
        data: await this.cartRepository.deleteCart(id),
      };
    } catch (error) {
      AppLogger.error(`Failed to delete cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete cart',
      });
    }
  }
}
