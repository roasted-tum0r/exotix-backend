import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartRepository } from './cart.repository';
import { ItemsRepository } from '../items/items.repository';
import { User } from '@prisma/client';
import { CartItemsRepository } from '../cart-items/cart-items.repository';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemsRepository: CartItemsRepository,
    private readonly itemRepository: ItemsRepository,
  ) {}
  async addToCartService(createCartDto: CreateCartDto, user: User) {
    try {
      const checkExistingCart = await this.cartRepository.getCartByUserID(user.id);
      if(checkExistingCart){
        //checkExistingCart.items.id if this exists tht means item exists, or else we create, so we need two createitemrepo methods, one to add and one to update
      }
      //if cart doesnt exist we create a new cart and add the item to it so we call one from cart repo one from cat item repo both to create
      // Reminder: Need to create a bulk item discount update call in item module
    } catch (error) {}
  }

  async getCartService(user: User) {
    try {
      return {
        status: HttpStatus.OK,
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
