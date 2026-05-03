import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto, CreateItemRepoDto } from './create-item.dto';

import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImagePublicIds?: string[];
}
export class UpdateItemRepoDto extends PartialType(CreateItemRepoDto) {}

