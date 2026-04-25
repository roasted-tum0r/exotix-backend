import { PartialType } from '@nestjs/mapped-types';
import { CreateItemCategoryDto } from './create-item-category.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateItemCategoryDto extends PartialType(CreateItemCategoryDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImagePublicIds?: string[];
}
