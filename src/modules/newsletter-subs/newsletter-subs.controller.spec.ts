import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterSubsController } from './newsletter-subs.controller';
import { NewsletterSubsService } from './newsletter-subs.service';

describe('NewsletterSubsController', () => {
  let controller: NewsletterSubsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsletterSubsController],
      providers: [NewsletterSubsService],
    }).compile();

    controller = module.get<NewsletterSubsController>(NewsletterSubsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
