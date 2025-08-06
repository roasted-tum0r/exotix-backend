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
import { AppLogger } from '../utils/app.logger';

@Injectable()
export class EncryptIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
         AppLogger.log('[EncryptIdInterceptor] 🔐 Interceptor Hit, Data:', JSON.stringify(data));
        // Encrypt `id` if present
        if (Array.isArray(data)) {
          return data.map((item) => this.encrypt(item));
        } else {
          return this.encrypt(data);
        }
      }),
    );
  }

  private encrypt(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => this.encrypt(item));
  }

  if (obj && typeof obj === 'object') {
    const encrypted: any = {};
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'object') {
        encrypted[key] = this.encrypt(value);
      } else if (key.toLowerCase().endsWith('id') && typeof value === 'number') {
        encrypted[key] = encryptId(value);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }

  return obj;
}
}
