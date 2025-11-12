import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCartDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;
  @IsUUID()
  userId?: string | null;
  @IsBoolean()
  isGuestCart: boolean;
}
export class GetCartDto {
  @IsUUID()
  userId?: string;
}
