import { PartialType } from '@nestjs/mapped-types';
import { CreateOfferDto, CreateOfferExtraDto } from './create-offer.dto';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  name: undefined;
  description: undefined;
  type: undefined;
  validFrom: undefined;
  validUpto: undefined;
  discountType: undefined;
  discountValue: undefined;
  maxDiscountAmount: undefined;
  minPurchaseAmount: undefined;
  minQuantity: undefined;
  maxFreeQuantity: undefined;
  applicableScope: undefined;
  isStackable: undefined;
}
export class UpdateOfferExtrasDto extends PartialType(CreateOfferExtraDto) {}
