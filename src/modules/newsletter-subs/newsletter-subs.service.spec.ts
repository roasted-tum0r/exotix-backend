import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterSubsService } from './newsletter-subs.service';

describe('NewsletterSubsService', () => {
  let service: NewsletterSubsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsletterSubsService],
    }).compile();

    service = module.get<NewsletterSubsService>(NewsletterSubsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
