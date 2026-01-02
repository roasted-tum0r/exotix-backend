import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { NewsletterSubscriptionsRepository } from './newsletter-subs.repository';
import {
  CreateNewsletterSubscriberDto,
  GetNewsletterSubscribersDto,
  UnsubscribeNewsletterDto,
} from './dto/create-newsletter-sub.dto';
import { MailService } from 'src/services/mail/mailservice.service';
import { Templates } from 'src/config/templates/template';

@Injectable()
export class NewsletterSubsService {
  private readonly logger = new Logger(NewsletterSubsService.name);

  constructor(
    private readonly newsletterRepo: NewsletterSubscriptionsRepository,
    private readonly mailService: MailService,
  ) {}

  async createSubscriber(dto: CreateNewsletterSubscriberDto) {
    try {
      await this.newsletterRepo.createSubscriber(dto);

      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        dto.email,
        `🎉 Welcome to Anandini's!`,
        Templates.welcomeEmailBySubscription(
          dto.email,
          'http://localhost:4060/exotix-api/newsletter-subs/unsubscribe', // replace with env var later
        ),
      );

      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Successfully subscribed to newsletter',
      };
    } catch (error) {
      this.logger.error(
        `Service error while creating subscriber for ${dto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async unsubscribe(dto: UnsubscribeNewsletterDto) {
    try {
      await this.newsletterRepo.unsubscribe(dto);
      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        dto.email,
        `You’ve been unsubscribed from Anandini's newsletter`,
        Templates.unsubscribeConfirmationEmail(dto.email),
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Successfully unsubscribed from newsletter',
      };
    } catch (error) {
      this.logger.error(
        `Service error while unsubscribing ${dto.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async getSubscribers(dto: GetNewsletterSubscribersDto) {
    try {
      const payload = await this.newsletterRepo.getSubscribers(dto);

      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Newsletter subscribers list fetched successfully',
        data: payload,
      };
    } catch (error) {
      this.logger.error(
        `Service error while fetching newsletter subscribers`,
        error.stack,
      );
      throw error;
    }
  }
}
