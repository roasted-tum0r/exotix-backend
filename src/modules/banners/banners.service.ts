import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BannersRepository } from './banners.repository';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { IPagination } from 'src/common/interfaces/app.interface';
import { Prisma, User, UserRole } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class BannersService {
  constructor(private readonly repository: BannersRepository) {}

  async create(createBannerDto: CreateBannerDto, userId: string) {
    try {
      const payload = await this.repository.create(createBannerDto, userId);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Banner was created',
        data: payload,
      };
    } catch (error) {
      AppLogger.error('Failed to create banner', error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while creating banner.',
      });
    }
  }

  async findAll(pagination: IPagination, user?: User) {
    try {
      const isPrivileged =
        user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLOYEE;
      const where = this.buildBannerWhere(isPrivileged);
      const payload = await this.repository.findAll(pagination, user, where);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banners were fetched',
        data: payload,
      };
    } catch (error) {
      AppLogger.error('Failed to fetch banners', error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching banners.',
      });
    }
  }

  async findOne(id: string, user?: User) {
    try {
      const isPrivileged =
        user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLOYEE;
      const where = this.buildBannerWhere(isPrivileged);

      // Merge ID with visibility filters
      const finalWhere = { ...where, id };

      const banner = await this.repository.findOne(finalWhere, user);
      if (!banner) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: `Banner with ID ${id} not found.`,
        });
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner fetched successfully.',
        data: banner,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      AppLogger.error(`Failed to fetch banner with id ${id}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while fetching banner.',
      });
    }
  }

  async update(
    id: string,
    updateBannerDto: UpdateBannerDto,
    userId: string,
    user: User,
  ) {
    try {
      const banner = await this.findOne(id, user); // checks existence and visibility
      if (!banner) throw new NotFoundException();

      const updatedRecord = await this.repository.update(
        id,
        updateBannerDto,
        userId,
        user,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner was updated.',
        data: updatedRecord,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      AppLogger.error(`Failed to update banner with id ${id}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while updating banner.',
      });
    }
  }

  async deactivate(id: string, userId: string) {
    try {
      const result = await this.repository.deactivate(id, userId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner was deactivated.',
        data: result,
      };
    } catch (error) {
      AppLogger.error(`Failed to deactivate banner with id ${id}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deactivating banner.',
      });
    }
  }

  async restore(id: string, userId: string) {
    try {
      const result = await this.repository.restore(id, userId);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner was restored.',
        data: result,
      };
    } catch (error) {
      AppLogger.error(`Failed to restore banner with id ${id}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while restoring banner.',
      });
    }
  }

  async hardDelete(id: string) {
    try {
      const result = await this.repository.hardDelete(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner was permanently deleted.',
        data: result,
      };
    } catch (error) {
      AppLogger.error(
        `Failed to hard-delete banner with id ${id}`,
        error.stack,
      );
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while permanently deleting banner.',
      });
    }
  }

  async remove(id: string) {
    try {
      const deletedBanner = await this.repository.delete(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Banner was deleted.',
        data: deletedBanner,
      };
    } catch (error) {
      AppLogger.error(`Failed to delete banner with id ${id}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while deleting banner.',
      });
    }
  }

  async toggleOngoing(id: string, isOngoing: boolean, userId: string) {
    try {
      const updatedBanner = await this.repository.toggleOngoing(
        id,
        isOngoing,
        userId,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Banner status toggled to ${isOngoing ? 'ongoing' : 'stopped'}.`,
        data: updatedBanner,
      };
    } catch (error) {
      AppLogger.error(
        `Failed to toggle banner ongoing status for id ${id}`,
        error.stack,
      );
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong while toggling banner status.',
      });
    }
  }

  private buildBannerWhere(isPrivileged = false): Prisma.BannerWhereInput {
    // Admins/Employees see everything (including deactivated banners)
    // Wait, categories: Admins see everything. Public sees only active.
    if (isPrivileged) return {};

    // Public users only see ACTIVE (lifecycle) AND ONGOING (operational) banners within date range
    const now = new Date();
    return {
      isActive: true,
      isOngoing: true,
      OR: [
        {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        {
          startDate: null,
          endDate: null,
        },
        {
          startDate: { lte: now },
          endDate: null,
        },
        {
          startDate: null,
          endDate: { gte: now },
        },
      ],
    };
  }
}
