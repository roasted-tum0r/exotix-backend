import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';

export class CreateOrderDto {
  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsOptional()
  couponId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // e.g., "CASH_ON_DELIVERY", "ONLINE_MANUAL"
}
