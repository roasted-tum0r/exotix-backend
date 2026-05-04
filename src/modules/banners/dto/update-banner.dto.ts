import { PartialType } from '@nestjs/mapped-types';
import { CreateBannerDto } from './create-banner.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deletedImagePublicIds?: string[];
}
