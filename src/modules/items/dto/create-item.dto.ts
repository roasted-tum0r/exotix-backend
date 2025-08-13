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
  categoryId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  discountStart?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  discountEnd?: Date;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class CreateItemRepoDto extends CreateItemDto {
  @IsOptional()
  createdBy: number;
  @IsOptional()
  updatedBy: number;
}
