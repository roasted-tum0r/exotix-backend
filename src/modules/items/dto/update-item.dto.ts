import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto, CreateItemRepoDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
export class UpdateItemRepoDto extends PartialType(CreateItemRepoDto) {}

