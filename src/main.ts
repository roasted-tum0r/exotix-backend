import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { EncryptIdInterceptor } from './common/intercptors/encrypt-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.setGlobalPrefix('exotix-api');
  app.enableShutdownHooks();
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(app.get(EncryptIdInterceptor));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
