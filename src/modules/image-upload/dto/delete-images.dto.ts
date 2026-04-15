import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class DeleteImagesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Provide at least one publicId to delete.' })
  publicIds: string[];
}
