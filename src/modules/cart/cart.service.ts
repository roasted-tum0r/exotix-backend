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
    } catch (error: any) {
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
        const cart: any = await this.cartRepository.getCartByUserID(
          getCart.userId,
          isGuestCart,
        );
        if (cart && cart.items) {
          let subtotal = 0;
          cart.items = cart.items.map((cartItem: any) => {
            subtotal += cartItem.item.price * cartItem.quantity;
            return {
              ...cartItem,
              item: this.itemRepository.transformItemImages(cartItem.item),
            };
          });

          // Add Price Summary for Frontend
          cart.paymentSummary = this.calculateTotals(subtotal);
        }
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Cart fetched',
          data: cart,
        };
      } else {
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Cart fetched',
          data: null,
        };
      }
    } catch (error: any) {
      AppLogger.error(`Failed get cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get cart',
      });
    }
  }

  private calculateTotals(subtotal: number) {
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const deliveryFee = subtotal > 1000 ? 0 : 500;
    const totalAmount = subtotal + gstAmount + deliveryFee;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstRate: 18,
      deliveryThreshold: 1000,
    };
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
    } catch (error: any) {
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
      const mergeData = await this.cartRepository.mergeCart(
        user.id,
        guestUserId,
        user.firstname,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Carts merged successfully',
        data: mergeData,
      };
    } catch (error: any) {
      AppLogger.error(`Failed to merge cart for user ${user.id}`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to merge carts',
      });
    }
  }

  async remove(id: string, itemIds: string[] = []) {
    try {
      const deletedCart = await this.cartRepository.deleteCart(id, itemIds);
      if (deletedCart.cartItem.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Cart was deleted',
          data: deletedCart,
        };
      }
    } catch (error: any) {
      AppLogger.error(`Failed to delete cart`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete cart',
      });
    }
  }
}
