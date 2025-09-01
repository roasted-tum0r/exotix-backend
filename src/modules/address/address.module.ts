import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { PrismaService } from 'nestjs-prisma';
import { AddressRepository } from './address.repository';

@Module({
  controllers: [AddressController],
  providers: [AddressService, AddressRepository, PrismaService],
})
export class AddressModule {}
