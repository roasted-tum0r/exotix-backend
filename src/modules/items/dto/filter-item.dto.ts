import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IPagination } from 'src/common/interfaces/app.interface';

export class FilterItemDto {
  @IsOptional()
  @IsString()
  search?: string; // search by name/description

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  isAvailable?: 'true' | 'false';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
export class SearchItemDto extends FilterItemDto implements IPagination {
  @IsNotEmpty({ message: 'Page number cant be empty' })
  @Type(() => Number)
  @IsNumber()
  page: number;
  @IsNotEmpty({ message: 'Sort by field cant be empty' })
  @IsString()
  sortBy: string;
  @IsNotEmpty({ message: 'isAsc cant be null' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAsc: boolean;
  @IsNotEmpty({ message: 'Page limit cant be empty' })
  @Type(() => Number)
  @IsNumber()
  limit: number;
}
