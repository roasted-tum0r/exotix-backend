import { Injectable, HttpStatus, InternalServerErrorException, HttpException } from '@nestjs/common';
import { AppDataRepository } from './app-data.repository';
import { CreateAppDataDto } from './dto/create-app-data.dto';
import { UpdateAppDataDto } from './dto/update-app-data.dto';
import { User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class AppDataService {
  constructor(private readonly repository: AppDataRepository) { }
  async create(dto: CreateAppDataDto) {
    try {
      const result = await this.repository.create(dto);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Application data initialized successfully.',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      AppLogger.error('AppDataService: create failed', error.stack);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to initialize app data.',
      });
    }
  }

  async update(dto: UpdateAppDataDto) {
    try {
      const result = await this.repository.update(dto);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Application data updated successfully.',
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      AppLogger.error('AppDataService: update failed', error.stack);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update app data.',
      });
    }
  }

  async getAppData(user?: User) {
    try {
      const result = await this.repository.find(user);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Application data fetched successfully.',
        data: result,
      };
    } catch (error) {
      AppLogger.error('AppDataService: fetch failed', error.stack);
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch app data.',
      });
    }
  }
}
