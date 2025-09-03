import { OfferType, DiscountType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IPagination } from 'src/common/interfaces/app.interface';

export class FindOfferDto implements IPagination {
  @IsNotEmpty()
  @IsNumber()
  page: number;
  @IsNotEmpty()
  @IsNumber()
  limit: number;
  @IsOptional()
  @IsString()
  search?: string;
  @IsNotEmpty()
  @IsString()
  sortBy: string;
  @IsOptional()
  @IsBoolean()
  isAsc: boolean;
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
  @IsOptional()
  @IsEnum(OfferType)
  type?: OfferType;
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;
}
