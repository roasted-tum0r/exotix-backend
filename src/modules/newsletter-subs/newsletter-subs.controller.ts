import { Controller, Get, Post, Body, Query, Logger, UseGuards } from '@nestjs/common';
import { NewsletterSubsService } from './newsletter-subs.service';
import {
  CreateNewsletterSubscriberDto,
  GetNewsletterSubscribersDto,
  UnsubscribeNewsletterDto,
} from './dto/create-newsletter-sub.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { RolesGuard } from 'src/auth/guards/role-auth.guard';

@Controller('newsletter-subs')
@UseGuards(RolesGuard)
export class NewsletterSubsController {
  private readonly logger = new Logger(NewsletterSubsController.name);

  constructor(private readonly newsletterSubsService: NewsletterSubsService) {}
  @Public('Subscribe to Newsletter')
  @Post()
  async create(@Body() dto: CreateNewsletterSubscriberDto) {
    try {
      return await this.newsletterSubsService.createSubscriber(dto);
    } catch (error) {
      this.logger.error(
        `Controller error while creating subscriber`,
        error.stack,
      );
      throw error;
    }
  }
  @Public('UnSubscribe to Newsletter')
  @Get('unsubscribe')
  async unsubscribe(@Query() dto: UnsubscribeNewsletterDto) {
    try {
      return await this.newsletterSubsService.unsubscribe(dto);
    } catch (error) {
      this.logger.error(`Controller error while unsubscribing`, error.stack);
      throw error;
    }
  }
  @Roles('admin', 'employee')
  @Get()
  async getAll(@Query() dto: GetNewsletterSubscribersDto) {
    try {
      return await this.newsletterSubsService.getSubscribers(dto);
    } catch (error) {
      this.logger.error(
        `Controller error while fetching subscribers`,
        error.stack,
      );
      throw error;
    }
  }
}
