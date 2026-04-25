import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImagesDto } from 'src/modules/reviews/dto/review.dto';

export class CreateItemCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  bannerimage?: ImagesDto;

  /** index 0 → CATEGORY_BANNER, index 1 → CATEGORY_IMAGE */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  categoryImage?: ImagesDto;
}

