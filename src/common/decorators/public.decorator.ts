import { SetMetadata } from '@nestjs/common';
import { AppLogger } from '../utils/app.logger';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (methodName: string) => {
  AppLogger.log('✅ @Public() applied' + methodName);
  return SetMetadata(IS_PUBLIC_KEY, true);
};
