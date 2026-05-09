import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AddToWishlistDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;
}

export class RemoveFromWishlistDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;
}

export class SearchWishlistDto {
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

  @IsOptional()
  @IsString()
  search?: string;
}
