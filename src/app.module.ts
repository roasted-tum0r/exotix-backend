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
import { EncryptIdInterceptor } from './common/intercptors/encrypt-id.interceptor';
import { PingModule } from './modules/ping/ping.module';
import { ItemsModule } from './modules/items/items.module';
import { ItemCategoriesModule } from './modules/item-categories/item-categories.module';
import { RolesGuard } from './auth/guards/role-auth.guard';
import { DateToISOStringInterceptor } from './common/intercptors/date-transformer-interceptor';

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
    PingModule,
    ItemsModule,
    ItemCategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EncryptIdInterceptor,
    DateToISOStringInterceptor,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
