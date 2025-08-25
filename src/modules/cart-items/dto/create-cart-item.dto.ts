import { IsInt, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartItemDto {
  @IsInt()
  @Type(() => Number)
  cartId: string;

  @IsInt()
  @Type(() => Number)
  itemId: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;
}
