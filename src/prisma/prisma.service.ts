import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      transactionOptions: {
        maxWait: 10000, // wait up to 10s to get a connection from pool
        timeout: 30000, // query timeout = 30s
      },
    });

    // this.$on('query', (e: Prisma.QueryEvent) => {
    //   AppLogger.log('🔎 [Prisma Query]:', e.query);
    //   AppLogger.log('🟢 [Params]:', e.params);
    //   AppLogger.log('⏱️ [Duration]:', e.duration, 'ms');
    // });

    // this.$on('warn', (e: Prisma.LogEvent) => {
    //   AppLogger.warn('⚠️ [Prisma Warn]:', e.message);
    // });

    // this.$on('info', (e: Prisma.LogEvent) => {
    //   AppLogger.info('ℹ️ [Prisma Info]:', e.message);
    // });

    // this.$on('error', (e: Prisma.LogEvent) => {
    //   AppLogger.error('❌ [Prisma Error]:', e.message);
    // });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  //   async onBeforeExit(app: INestApplication) {
  //     (this as any).$on('beforeExit', async () => {
  //       await app.close();
  //     });
  //   }
}
