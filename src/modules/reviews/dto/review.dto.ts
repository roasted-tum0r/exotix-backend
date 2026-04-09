import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IPagination } from 'src/common/interfaces/app.interface';

export enum ReviewType {
  ITEM = 'ITEM',
  BRANCH = 'BRANCH',
}

export class CreateReviewDto {
  @IsNotEmpty()
  @IsEnum(ReviewType, { message: 'reviewType must be ITEM or BRANCH' })
  reviewType: ReviewType;

  /**
   * Required when reviewType === ITEM.
   * The ID of the item being reviewed.
   */
  @IsOptional()
  @IsUUID()
  itemId?: string;

  /**
   * Required when reviewType === BRANCH.
   * The ID of the branch being reviewed.
   */
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ListReviewsDto implements IPagination {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @IsNotEmpty()
  @IsString()
  sortBy: string;

  @IsNotEmpty()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAsc: boolean;
}
