import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { ItemsRepository } from './items.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [ItemsController],
  providers: [ItemsService,ItemsRepository],
})
export class ItemsModule {}
