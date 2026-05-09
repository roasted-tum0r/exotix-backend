import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImagesDto } from 'src/modules/reviews/dto/review.dto';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  thumbnailImage?: ImagesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  galleryImages?: ImagesDto[];

  @IsNumber()
  price: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class CreateItemRepoDto extends CreateItemDto {
  @IsOptional()
  createdBy: string;
  @IsOptional()
  updatedBy: string;
}
