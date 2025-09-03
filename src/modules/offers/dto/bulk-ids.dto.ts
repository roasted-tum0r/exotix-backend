import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class BulkIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}
