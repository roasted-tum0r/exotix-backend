import { Test, TestingModule } from '@nestjs/testing';
import { ItemCategoriesService } from './item-categories.service';

describe('ItemCategoriesService', () => {
  let service: ItemCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemCategoriesService],
    }).compile();

    service = module.get<ItemCategoriesService>(ItemCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
