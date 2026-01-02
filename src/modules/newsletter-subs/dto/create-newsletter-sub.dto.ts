import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionSource } from '@prisma/client';
import { IsBoolean } from 'class-validator';

export class CreateNewsletterSubscriberDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(SubscriptionSource)
  source?: SubscriptionSource;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
export class CreateNewsletterSubDto {}
export class UnsubscribeNewsletterDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;
}

export class GetNewsletterSubscribersDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}