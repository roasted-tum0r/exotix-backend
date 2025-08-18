import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { ItemsRepository } from '../items/items.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CartController],
  providers: [CartService, CartRepository, ItemsRepository, PrismaService],
})
export class CartModule {}
