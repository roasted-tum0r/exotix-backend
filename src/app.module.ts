import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './services/redis/redis.module';
import { MailModule } from './services/mail/mailservice.module';
import { APP_GUARD } from '@nestjs/core';
import { GlobalAuthGuard } from './auth/guards/global-auth.guard';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    RedisModule,
    AuthModule,
    PrismaModule,
    MailModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
  ],
})
export class AppModule {}
