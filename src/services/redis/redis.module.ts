import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as IORedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    IORedisModule.forRoot({
      type: 'single',
      options: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
        password: process.env.REDIS_PASSWORD,
        // tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
