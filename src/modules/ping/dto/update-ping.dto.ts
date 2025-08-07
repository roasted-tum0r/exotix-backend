import { PartialType } from '@nestjs/mapped-types';
import { CreatePingDto } from './create-ping.dto';

export class UpdatePingDto extends PartialType(CreatePingDto) {}
