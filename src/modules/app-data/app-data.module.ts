import { Module } from '@nestjs/common';
import { AppDataService } from './app-data.service';
import { AppDataController } from './app-data.controller';
import { AppDataRepository } from './app-data.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[AuthModule],
  controllers: [AppDataController],
  providers: [AppDataService, AppDataRepository],
})
export class AppDataModule {}
