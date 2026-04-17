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
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IPagination } from 'src/common/interfaces/app.interface';

/** Validated image shape used in create / update review DTOs. */
export class ImagesDto {
  @IsString()
  publicId: string;

  @IsString()
  url: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  images?: ImagesDto[];
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

  /** publicIds of existing images to remove from Cloudinary + the metadata table. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagesToDelete?: string[];

  /** Newly uploaded images to persist in the metadata table. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagesDto)
  imagesToAdd?: ImagesDto[];
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