import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  Max,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateItemRepoDto extends CreateItemDto {
  @IsOptional()
  createdBy: string;
  @IsOptional()
  updatedBy: string;
}
