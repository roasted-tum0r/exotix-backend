import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AddressType } from '@prisma/client';

export class CreateAddressDto {
  @IsString()
  receiverName: string;

  @IsOptional()
  @IsEnum(AddressType)
  type?: AddressType;

  @IsOptional()
  @IsString()
  houseNo?: string;

  @IsOptional()
  @IsString()
  flatNo?: string;

  @IsString()
  streetName: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  zipcode: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}