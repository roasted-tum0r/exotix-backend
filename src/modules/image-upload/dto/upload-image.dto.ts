import { IsEnum, IsNotEmpty } from 'class-validator';
import { ImageOwnerType } from '@prisma/client';

export class UploadImageDto {
  @IsEnum(ImageOwnerType, {
    message: `ownerType must be one of: ${Object.values(ImageOwnerType).join(', ')}`,
  })
  @IsNotEmpty()
  ownerType: ImageOwnerType;
}
