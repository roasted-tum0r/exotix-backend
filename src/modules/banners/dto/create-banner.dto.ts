import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImagesDto } from 'src/modules/reviews/dto/review.dto';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImagesDto)
  bannerImage?: ImagesDto;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isOngoing?: boolean;
}
