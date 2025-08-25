import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';

export class FilterItemDto {
  @IsOptional()
  @IsString()
  search?: string; // search by name/description

  @IsOptional()
  @IsNumber()
  categoryIds?: string[];

  @IsOptional()
  @IsString()
  isAvailable?: 'true'|'false';

  @IsOptional()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Min(0)
  maxPrice?: number;
}
