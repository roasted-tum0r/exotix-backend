import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PrismaService } from 'nestjs-prisma';
import { AppLogger } from 'src/common/utils/app.logger';
import { IPagination } from 'src/common/interfaces/app.interface';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    try {
      return await this.prisma.address.create({
        data: { ...dto, userId },
        select: {
          id: true,
          receiverName: true,
          line1: true,
          line2: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async findById(id: string) {
    try {
      return await this.prisma.address.findUnique({
        where: { id },
        select: {
          id: true,
          receiverName: true,
          line1: true,
          line2: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async findManyByUser(userId: string, paginatinObject: IPagination) {
    try {
      const [categories, total] = await this.prisma.$transaction([
        this.prisma.address.findMany({
          where: {
            userId,
          },
          orderBy: {
            [`${paginatinObject.sortBy}`]: paginatinObject.isAsc
              ? 'asc'
              : 'desc',
          },
          skip: (paginatinObject.page - 1) * paginatinObject.limit,
          take: paginatinObject.limit,
          select: {
            id: true,
            receiverName: true,
            line1: true,
            line2: true,
            latitude: true,
            longitude: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            isDefault: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.address.count({
          where: {
            userId,
          },
        }),
      ]);

      return await {
        total,
        currentPage: paginatinObject.page,
        totalPages: Math.ceil(total / paginatinObject.limit),
        results: categories,
      };
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async update(id: string, dto: UpdateAddressDto) {
    try {
      return await this.prisma.address.update({
        where: { id },
        data: dto,
        select: {
          id: true,
          receiverName: true,
          line1: true,
          line2: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async deleteMany(ids: string[]) {
    try {
      return await this.prisma.address.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }

  async findDuplicate(userId: string, dto: CreateAddressDto) {
    try {
      return await this.prisma.address.findFirst({
        where: {
          userId,
          line1: dto.line1,
          line2: dto.line2,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postalCode: dto.postalCode,
        },
        select: {
          id: true,
          receiverName: true,
          line1: true,
          line2: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async findDefault(userId: string) {
    try {
      return this.prisma.address.findFirst({
        where: { userId, isDefault: true },
        select: {
          id: true,
          receiverName: true,
          line1: true,
          line2: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
}
