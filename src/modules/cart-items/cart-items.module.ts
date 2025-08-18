import { Module } from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { CartItemsController } from './cart-items.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartItemsRepository } from './cart-items.repository';
import { ItemsRepository } from '../items/items.repository';

@Module({
  controllers: [CartItemsController],
  providers: [
    CartItemsService,
    PrismaService,
    CartItemsRepository,
    ItemsRepository,
  ],
})
export class CartItemsModule {}
