import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './services/redis/redis.module';
import { MailModule } from './services/mail/mailservice.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalAuthGuard } from './auth/guards/global-auth.guard';
import { LoggerModule } from 'nestjs-pino';
import { EncryptIdInterceptor } from './common/intercptors/encrypt-id.interceptor';
import { PingModule } from './modules/ping/ping.module';
import { ItemsModule } from './modules/items/items.module';
import { ItemCategoriesModule } from './modules/item-categories/item-categories.module';
import { RolesGuard } from './auth/guards/role-auth.guard';
import { DateToISOStringInterceptor } from './common/intercptors/date-transformer-interceptor';
import { CartModule } from './modules/cart/cart.module';
import { CartItemsModule } from './modules/cart-items/cart-items.module';
import { BranchModule } from './modules/branch/branch.module';
import { AddressModule } from './modules/address/address.module';
import { OffersModule } from './modules/offers/offers.module';
import { ConfigModule } from '@nestjs/config';
import { NewsletterSubsModule } from './modules/newsletter-subs/newsletter-subs.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UploadModule } from './modules/image-upload/upload.module';
import { OptionalAuthGuard } from './auth/optionalguards/optional-auth.guard';
import { BannersModule } from './modules/banners/banners.module';
import { AppDataModule } from './modules/app-data/app-data.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RazorpayModule } from './services/razorpay/razorpay.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';

@Module({
  imports: [
    ActivityLogModule,
    RazorpayModule,
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
    ConfigModule.forRoot({
      isGlobal: true,       // make env available everywhere
      envFilePath: '.env',  // OPTIONAL, but ensures correct path
    }),
    PingModule,
    ItemsModule,
    ItemCategoriesModule,
    CartModule,
    CartItemsModule,
    BranchModule,
    AddressModule,
    OffersModule,
    NewsletterSubsModule,
    WishlistModule,
    ReviewsModule,
    UploadModule,
    BannersModule,
    AppDataModule,
    OrdersModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // EncryptIdInterceptor,
    DateToISOStringInterceptor,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: OptionalAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
