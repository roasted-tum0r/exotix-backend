import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { OfferRepository } from './offers.repository';

@Module({
  controllers: [OffersController],
  providers: [OffersService, OfferRepository, PrismaService],
})
export class OffersModule {}
