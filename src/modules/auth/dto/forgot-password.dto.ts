import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ForgotPasswordSubmitResetDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordVerifyOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MaxLength(6)
  OTP: string;

  @IsNotEmpty()
  @IsString()
  hash: string;
}
