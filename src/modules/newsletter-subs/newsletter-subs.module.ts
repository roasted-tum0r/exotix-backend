import { Module } from '@nestjs/common';
import { NewsletterSubsService } from './newsletter-subs.service';
import { NewsletterSubsController } from './newsletter-subs.controller';
import { NewsletterSubscriptionsRepository } from './newsletter-subs.repository';
import { UserRepository } from '../auth/auth.repository';

@Module({
  controllers: [NewsletterSubsController],
  providers: [NewsletterSubsService, NewsletterSubscriptionsRepository, UserRepository],
})
export class NewsletterSubsModule {}
