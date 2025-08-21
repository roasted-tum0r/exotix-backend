import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { ItemsRepository } from '../items/items.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartItemsRepository } from '../cart-items/cart-items.repository';

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    CartRepository,
    ItemsRepository,
    PrismaService,
    CartItemsRepository,
  ],
})
export class CartModule {}
