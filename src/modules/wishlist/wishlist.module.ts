import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { ItemsRepository } from '../items/items.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [WishlistController],
  providers: [
    WishlistService,
    WishlistRepository,
    ItemsRepository,
    PrismaService,
  ],
})
export class WishlistModule {}
