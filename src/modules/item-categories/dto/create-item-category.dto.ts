import { OmitType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional, IsUrl, IsInt } from 'class-validator';

export class CreateItemCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Image must be a valid URL' })
  image?: string;
}

