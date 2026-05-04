import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAppDataDto } from './dto/create-app-data.dto';
import { UpdateAppDataDto } from './dto/update-app-data.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AppDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAppDataDto) {
    try {
      const existing = await this.prisma.appData.findFirst();
      if (existing) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'AppData record already exists. Use update instead.',
        });
      }
      return await this.prisma.appData.create({ data });
    } catch (error) {
      AppLogger.error('AppDataRepo: Failed to create', error.stack);
      throw error;
    }
  }

  async update(data: UpdateAppDataDto) {
    try {
      const existing = await this.prisma.appData.findFirst();
      if (!existing) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No AppData record found to update. Create one first.',
        });
      }
      return await this.prisma.appData.update({
        where: { id: existing.id },
        data,
      });
    } catch (error) {
      AppLogger.error('AppDataRepo: Failed to update', error.stack);
      throw error;
    }
  }

  async find(user?: User) {
    try {
      const data = await this.prisma.appData.findFirst();
      if (!data) return null;

      // If Public (no user or not admin), return limited data
      if (!user || user.role !== UserRole.ADMIN) {
        const { id, metadata, createdAt, updatedAt, ...publicData } = data;
        return publicData;
      }

      // If Admin, return full data
      return data;
    } catch (error) {
      AppLogger.error('AppDataRepo: Failed to find', error.stack);
      throw error;
    }
  }
}
