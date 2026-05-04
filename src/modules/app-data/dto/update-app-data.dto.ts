import { PartialType } from '@nestjs/mapped-types';
import { CreateAppDataDto } from './create-app-data.dto';

export class UpdateAppDataDto extends PartialType(CreateAppDataDto) {}
