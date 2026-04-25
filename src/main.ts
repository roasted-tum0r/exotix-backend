import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { EncryptIdInterceptor } from './common/intercptors/encrypt-id.interceptor';
import { DateToISOStringInterceptor } from './common/intercptors/date-transformer-interceptor';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.use(cookieParser());
  app.enableCors({
    // NOTE: wildcard '*' + credentials:true is rejected by browsers.
    // Switch to the real frontend origin(s) once you go to production.
    origin: process.env.FRONTEND_ORIGINS
      ? process.env.FRONTEND_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'https://anandinis-exotica-store.vercel.app', 'https://anandinis-exotica-store.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // required for HttpOnly cookie exchange
  });
  app.setGlobalPrefix('exotix-api');
  app.enableShutdownHooks();
  app.useLogger(app.get(Logger));
  // app.useGlobalInterceptors(app.get(EncryptIdInterceptor));
  app.useGlobalInterceptors(app.get(DateToISOStringInterceptor));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
