import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { ItemsRepo } from './items.repository';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService,ItemsRepo],
})
export class ItemsModule {}
