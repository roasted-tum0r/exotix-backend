import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

export class TransferInventoryDto {
  // @ApiProperty({ example: 'branch-a-uuid', description: 'Source branch ID' })
  @IsString()
  @IsNotEmpty()
  fromBranchId: string;

  // @ApiProperty({ example: 'branch-b-uuid', description: 'Destination branch ID' })
  @IsString()
  @IsNotEmpty()
  toBranchId: string;

  // @ApiProperty({ example: 'item-uuid', description: 'Item ID to transfer' })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  // @ApiProperty({ example: 5, description: 'Quantity to transfer' })
  @IsInt()
  @Min(1)
  quantity: number;
}
