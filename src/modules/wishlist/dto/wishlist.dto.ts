import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;
}

export class RemoveFromWishlistDto {
  @IsNotEmpty()
  @IsUUID()
  itemId: string;
}
