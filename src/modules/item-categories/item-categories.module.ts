import { Module } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { ItemCategoriesController } from './item-categories.controller';
import { ItemCategoryRepo } from './item-categories.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [ItemCategoriesController],
  providers: [ItemCategoriesService,ItemCategoryRepo],
})
export class ItemCategoriesModule {}

