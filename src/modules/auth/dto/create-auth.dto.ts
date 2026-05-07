import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsStrongPassword,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '@prisma/client'; // ✅ Prisma enum
import { LoginType, RegistrationAs } from 'src/config/enums/authuser-enums';
import { Type } from 'class-transformer';
import { ImagesDto } from 'src/modules/reviews/dto/review.dto';

export class CreateAuthUserDto {
  @IsNotEmpty()
  registrationPurpose: RegistrationAs;

  @IsNotEmpty()
  firstname: string;

  @IsNotEmpty()
  lastname: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  phone: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  role: UserRole; // 'MANAGER', 'WAITER', etc. – consider using an enum if fixed roles
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagesDto)
  image?: ImagesDto;

  @IsOptional()
  @IsString()
  branchId?: string;
}
export class LoginWithOtpDto {
  @IsNotEmpty()
  @IsEnum(LoginType)
  loginType: LoginType;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(\S+@\S+\.\S+|\d{10})$/, {
    message: 'Must be a valid email or 10-digit phone number',
  })
  identifier: string; // Email or phone
}
export class LoginWithPasswordDto extends LoginWithOtpDto {
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
export class LoginOtpVerifyDto extends LoginWithOtpDto {
  @IsNotEmpty()
  @MaxLength(6)
  OTP: string;
  @IsNotEmpty()
  @IsString()
  hash_key: string;

  @IsOptional()
  @IsString()
  guestUserId?: string;
}

/** Sent to request a password-change OTP (requires auth) */
export class RequestPasswordChangeOtpDto {
  // No body needed – the current user is identified from the JWT.
  // This class can stay empty; it exists to document the intent.
}

/** Sent to finalize a password change after OTP is verified */
export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  OTP: string;

  @IsNotEmpty()
  @IsString()
  hash_key: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
