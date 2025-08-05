// encrypt-id.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { encryptId } from '../utils/encryption';

@Injectable()
export class EncryptIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Encrypt `id` if present
        if (Array.isArray(data)) {
          return data.map((item) => this.encrypt(item));
        } else {
          return this.encrypt(data);
        }
      }),
    );
  }

  private encrypt(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;

  Object.keys(obj).forEach((key) => {
    if (key.toLowerCase().endsWith('id') && typeof obj[key] === 'number') {
      obj[key] = encryptId(obj[key]); // Your encryption logic
    }
  });

  return obj;
}
}
