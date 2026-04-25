import { Module } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { ItemCategoriesController } from './item-categories.controller';
import { ItemCategoryRepo } from './item-categories.repository';

@Module({
  controllers: [ItemCategoriesController],
  providers: [ItemCategoriesService,ItemCategoryRepo],
})
export class ItemCategoriesModule {}

