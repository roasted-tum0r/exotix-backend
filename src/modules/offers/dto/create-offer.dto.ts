import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsInt,
} from 'class-validator';
import { OfferType, DiscountType, OfferScope } from '@prisma/client';

export class CreateOfferDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string|null;

  @IsEnum(OfferType)
  type: OfferType;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUpto: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsOptional()
  @IsNumber()
  discountValue: number|null;

  @IsOptional()
  @IsNumber()
  maxDiscountAmount: number|null;

  @IsOptional()
  @IsNumber()
  minPurchaseAmount: number|null;

  @IsOptional()
  @IsInt()
  minQuantity: number|null;

  @IsOptional()
  @IsInt()
  maxFreeQuantity: number|null;

  @IsEnum(OfferScope)
  applicableScope: OfferScope;

  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;
}
export class CreateOfferExtraDto extends CreateOfferDto {
  //   @IsOptional()
  //   @IsBoolean()
//   isActive?: boolean;

  //   @IsString()
  createdBy: string;

  //   @IsString()
  updatedBy: string;
}
