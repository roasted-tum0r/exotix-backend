// decrypt-id.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { decryptId } from '../utils/encryption';

@Injectable()
export class DecryptIdPipe implements PipeTransform {
  
  transform(value: string) {
    try {
      return decryptId(value); // returns number
    } catch (e) {
      throw new BadRequestException('Invalid ID format');
    }
  }
}
