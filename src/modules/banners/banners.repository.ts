import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ImageOwnerType, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { IPagination } from 'src/common/interfaces/app.interface';
import { AppLogger } from 'src/common/utils/app.logger';
import { UploadRepo } from '../image-upload/upload.repo';

@Injectable()
export class BannersRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uploadRepo: UploadRepo,
  ) {}

  // ─── Shared select projection ────────────────────────────────────────────────
  bannerSelectFields(user?: User): Prisma.BannerSelect {
    return {
      id: true,
      title: true,
      description: true,
      link: true,
      imageUrl: true,
      isActive: true,
      isOngoing: true,
      startDate: true,
      endDate: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      // creator
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          images: {
            select: {
              ownerType: true,
              id: true,
              imageUrl: true,
              publicId: true,
            },
            where: { ownerType: ImageOwnerType.USER },
          },
        },
      },
      // updater (only for privileged users)
      ...(user && (user.role === 'ADMIN' || user.role === 'EMPLOYEE') && {
        updater: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      }),
      images: {
        select: { ownerType: true, imageUrl: true, publicId: true },
        where: { ownerType: ImageOwnerType.BANNER },
      },
    };
  }

  async create(data: CreateBannerDto, userId: string) {
    try {
      const { bannerImage, ...bannerData } = data;

      const banner = await this.prismaService.banner.create({
        data: {
          ...bannerData,
          createdBy: userId,
          updatedBy: userId,
        },
        select: this.bannerSelectFields(),
      });

      if (bannerImage) {
        await this.uploadRepo.addImages(
          banner.id,
          [bannerImage],
          ImageOwnerType.BANNER,
        );
      }

      return banner;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not create banner.',
      });
    }
  }

  async findAll(
    pagination: IPagination,
    user?: User,
    where: Prisma.BannerWhereInput = {},
  ) {
    try {
      const [banners, total] = await this.prismaService.$transaction([
        this.prismaService.banner.findMany({
          where,
          orderBy: {
            [pagination.sortBy || 'priority']: pagination.isAsc ? 'asc' : 'desc',
          },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          select: this.bannerSelectFields(user),
        }),
        this.prismaService.banner.count({ where }),
      ]);

      return {
        total,
        currentPage: pagination.page,
        totalPages: Math.ceil(total / pagination.limit),
        results: banners,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not fetch banners.',
      });
    }
  }

  async findOne(where: Prisma.BannerWhereInput, user?: User) {
    try {
      return await this.prismaService.banner.findFirst({
        where,
        select: this.bannerSelectFields(user),
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong.',
      });
    }
  }

  async update(id: string, data: UpdateBannerDto, userId: string, user: User) {
    try {
      const { bannerImage, deletedImagePublicIds, ...bannerData } = data;

      const result = await this.prismaService.banner.update({
        where: { id },
        data: {
          ...bannerData,
          updatedBy: userId,
        },
        select: this.bannerSelectFields(user),
      });

      if (deletedImagePublicIds && deletedImagePublicIds.length > 0) {
        await this.uploadRepo.deleteImages(deletedImagePublicIds);
      }

      if (bannerImage) {
        await this.uploadRepo.addImages(id, [bannerImage], ImageOwnerType.BANNER);
      }

      return result;
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not update banner.',
      });
    }
  }

  async deactivate(id: string, userId: string) {
    try {
      return await this.prismaService.banner.update({
        where: { id },
        data: { isActive: false, updatedBy: userId },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not deactivate banner.',
      });
    }
  }

  async restore(id: string, userId: string) {
    try {
      return await this.prismaService.banner.update({
        where: { id },
        data: { isActive: true, updatedBy: userId },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not restore banner.',
      });
    }
  }

  async hardDelete(id: string) {
    try {
      await this.uploadRepo.purgeImagesByRef(id, [ImageOwnerType.BANNER]);
      return await this.prismaService.banner.delete({
        where: { id },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not permanently delete banner.',
      });
    }
  }

  async delete(id: string) {
    try {
      return await this.prismaService.banner.delete({
        where: { id },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not delete banner.',
      });
    }
  }

  async toggleOngoing(id: string, isOngoing: boolean, userId: string) {
    try {
      return await this.prismaService.banner.update({
        where: { id },
        data: { isOngoing, updatedBy: userId },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException('Could not toggle banner ongoing status.');
    }
  }
}
