import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from '../auth/auth.repository';
import {
  CreateNewsletterSubscriberDto,
  GetNewsletterSubscribersDto,
  UnsubscribeNewsletterDto,
} from './dto/create-newsletter-sub.dto';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
@Injectable()
export class NewsletterSubscriptionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {}
  async createSubscriber(data: CreateNewsletterSubscriberDto): Promise<void> {
    try {
      const { email, name, phone, source, tags } = data;

      const existingUser = await this.userRepository.findByEmail(email);

      await this.prisma.newsletterSubscriber.upsert({
        where: { email },
        update: {
          // intentionally empty for now
          // we do NOT overwrite user-provided data on re-subscribe
        },
        create: {
          email,
          name,
          phone,
          isUser: !!existingUser,
          source: source ?? 'FOOTER',
          tags,
        },
      });
    } catch (error) {
      // Handle known Prisma errors
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async unsubscribe(dto: UnsubscribeNewsletterDto): Promise<void> {
    try {
      await this.prisma.newsletterSubscriber.updateMany({
        where: {
          email: dto.email,
          isActive: true,
        },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async getSubscribers(dto: GetNewsletterSubscribersDto) {
    try {
      const { isActive } = dto;

      return await this.prisma.newsletterSubscriber.findMany({
        where: {
          ...(isActive !== undefined && { isActive }),
        },
        orderBy: {
          subscribedAt: 'desc',
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
}
