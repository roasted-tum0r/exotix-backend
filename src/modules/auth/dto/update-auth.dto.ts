import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthUserDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthUserDto) {}
