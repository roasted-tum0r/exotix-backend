import { HttpStatus, Injectable } from '@nestjs/common';
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
      const itemDetails = await this.itemRepository.findBulk(
        createCartDto.itemIds,
      );
      const checkExistingCart = await this.cartRepository.getCartByUserID(
        user.id,
      );

      if (checkExistingCart) {
        //checkExistingCart.items.id if this exists tht means item exists, or else we create, so we need two createitemrepo methods, one to add and one to update
        AppLogger.log('Found cart');
        const cartItems = checkExistingCart.items.map(
          (cartItem) => cartItem.item,
        );
        const existingIds: number[] = cartItems.map((item) => item.id);
        if (existingIds.join(',').includes(createCartDto.itemIds.join(','))) {
          existingIds.map(
            async (item) =>
              await this.cartItemsRepository.editCartItem(
                user.id,
                item,
                checkExistingCart.id,
                {
                  cartId: checkExistingCart.id,
                  itemId: item,
                  quantity: 1,
                },
              ),
          );
          // await this.cartItemsRepository.editCartItem(user.id, existingIds)
        }
        itemDetails.map(
          async (item) =>
            await this.cartItemsRepository.addCartItem(
              user.id,
              item.id,
              checkExistingCart.id,
              {
                cartId: checkExistingCart.id,
                itemId: item.id,
                quantity: 1,
              },
            ),
        );
        return {
          statusCode: HttpStatus.CREATED,
          error: false,
          message: 'Cart items were added',
          data: {
            count: await this.cartItemsRepository.getCartItemCount(
              checkExistingCart.id,
              user.id,
            ),
          },
        };
      } else {
        const newCartCreate = await this.cartRepository.addCartRow(user.id);
        itemDetails.map(
          async (item) =>
            await this.cartItemsRepository.addCartItem(
              user.id,
              item.id,
              newCartCreate.id,
              {
                cartId: newCartCreate.id,
                itemId: item.id,
                quantity: 1,
              },
            ),
        );
        return {
          statusCode: HttpStatus.CREATED,
          error: false,
          message: 'Cart items were added',
          data: {
            count: await this.cartItemsRepository.getCartItemCount(
              newCartCreate.id,
              user.id,
            ),
          },
        };
      }
      // const newCartItem = await this.cartItemsRepository.addCartItem()
      //if cart doesnt exist we create a new cart and add the item to it so we call one from cart repo one from cat item repo both to create
      // Reminder: Need to create a bulk item discount update call in item module
    } catch (error) {}
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
