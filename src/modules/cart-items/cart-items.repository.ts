import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartItemsRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async addCartItem(itemId: number, cartId: number) {
    try {
        // need to  create a dto
    //   return await this.prismaService.cartItem.create({});
    } catch (error) {}
  }
  async editCartItem(itemId: number, cartId: number) {
    try {
        // need to create a dto
    //   return await this.prismaService.cartItem.update({});
    } catch (error) {}
  }
}
