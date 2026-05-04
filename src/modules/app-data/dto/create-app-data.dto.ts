import { IsString, IsOptional, IsEmail, IsObject, IsUrl } from 'class-validator';

export class CreateAppDataDto {
  @IsString()
  appName: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsUrl()
  domainUrl?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
