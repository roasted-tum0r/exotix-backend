import { PartialType } from '@nestjs/mapped-types';
import { CreateNewsletterSubDto } from './create-newsletter-sub.dto';

export class UpdateNewsletterSubDto extends PartialType(CreateNewsletterSubDto) {}
