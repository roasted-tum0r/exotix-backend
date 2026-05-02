import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  Max,
  IsBoolean,
  IsDate,
  IsArray,
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
