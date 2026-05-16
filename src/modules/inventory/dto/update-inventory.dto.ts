import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

export class UpdateInventoryDto {
  // @ApiProperty({ example: 'item-uuid', description: 'ID of the item' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  // @ApiProperty({ example: 'branch-uuid', description: 'ID of the branch' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  // @ApiProperty({ example: 100, description: 'New quantity of the item' })
  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
