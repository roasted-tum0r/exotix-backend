import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthUserDto } from './create-auth.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAuthDto extends PartialType(CreateAuthUserDto) {
    @IsOptional()
    @IsString()
    deletedImagePublicId?: string;
}
