import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @IsString()
  receiverName: string;

  @IsEnum(AddressType)
  type: AddressType;

  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}