import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, OfferMaster } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOfferExtraDto } from './dto/create-offer.dto';
@Injectable()
export class OfferRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: CreateOfferExtraDto): Promise<OfferMaster> {
    try {
      const { createdBy, updatedBy, ...restofbody } = data;
      return await this.prisma.offerMaster.create({
        data: { ...restofbody, createdBy, updatedBy },
      });
    } catch (error) {
      AppLogger.error('Failed to create offer', error as any);
      throw new HttpException(
        'Failed to create offer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.OfferMasterWhereInput;
    orderBy?: Prisma.OfferMasterOrderByWithRelationInput;
  }): Promise<OfferMaster[]> {
    try {
      const { skip, take, where, orderBy } = params;
      return await this.prisma.offerMaster.findMany({
        skip,
        take,
        where,
        orderBy,
      });
    } catch (error) {
      AppLogger.error('Failed to fetch offers', error as any);
      throw new HttpException(
        'Failed to fetch offers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async count(where?: Prisma.OfferMasterWhereInput): Promise<number> {
    try {
      return await this.prisma.offerMaster.count({ where });
    } catch (error) {
      AppLogger.error('Failed to count offers', error as any);
      throw new HttpException(
        'Failed to count offers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: string): Promise<OfferMaster | null> {
    try {
      return await this.prisma.offerMaster.findUnique({ where: { id } });
    } catch (error) {
      AppLogger.error(`Failed to get offer ${id}`, error as any);
      throw new HttpException(
        'Failed to get offer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    data: Prisma.OfferMasterUpdateInput,
  ): Promise<OfferMaster> {
    try {
      return await this.prisma.offerMaster.update({ where: { id }, data });
    } catch (error) {
      AppLogger.error(`Failed to update offer ${id}`, error as any);
      if ((error as any).code === 'P2025') {
        // Prisma record not found
        throw new HttpException('Offer not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to update offer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    try {
      const result = await this.prisma.$transaction([
        this.prisma.offerMaster.deleteMany({ where: { id: { in: ids } } }),
      ]);
      // deleteMany returns { count }, but inside transaction result is array; take first element
      return result[0] as { count: number };
    } catch (error) {
      AppLogger.error('Failed to delete offers', error as any);
      throw new HttpException(
        'Failed to delete offers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deactivateMany(
    ids: string[],
    updatedBy: string,
  ): Promise<{ count: number }> {
    try {
      const result = await this.prisma.offerMaster.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false, updatedBy, updatedAt: new Date() },
      });
      return result;
    } catch (error) {
      AppLogger.error('Failed to deactivate offers', error as any);
      throw new HttpException(
        'Failed to deactivate offers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
