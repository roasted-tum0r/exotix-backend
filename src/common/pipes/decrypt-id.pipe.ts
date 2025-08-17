// decrypt-id.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { decryptId } from '../utils/encryption';

@Injectable()
export class DecryptIdPipe implements PipeTransform {
  transform(value: string | string[]) {
    try {
      if (Array.isArray(value))
        return value.map((val: string) => {
          return decryptId(val);
        });
      return decryptId(value); // returns number
    } catch (e) {
      throw new BadRequestException('Invalid ID format');
    }
  }
}
