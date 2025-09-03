import { PartialType } from '@nestjs/mapped-types';
import { CreateOfferDto, CreateOfferExtraDto } from './create-offer.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}
export class UpdateOfferExtrasDto extends PartialType(CreateOfferExtraDto) {}
