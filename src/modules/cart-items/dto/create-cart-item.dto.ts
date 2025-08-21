import { IsInt, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartItemDto {
  @IsInt()
  @Type(() => Number)
  cartId: number;

  @IsInt()
  @Type(() => Number)
  itemId: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  // Optional: if you ever allow setting prices directly from request
  @IsOptional()
  realPrice?: number;

  @IsOptional()
  discountedPrice?: number;
}
