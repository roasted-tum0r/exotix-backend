import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client'; // ✅ Prisma enum
import { LoginType, RegistrationAs } from 'src/config/enums/authuser-enums';

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
  hash_key;
}
