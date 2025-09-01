import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteAddressDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}