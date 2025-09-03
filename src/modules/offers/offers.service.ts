import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OfferRepository } from './offers.repository';
import { CreateOfferDto, CreateOfferExtraDto } from './dto/create-offer.dto';
import { UpdateOfferDto, UpdateOfferExtrasDto } from './dto/update-offer.dto';
import {
  Prisma,
  OfferMaster,
  OfferType,
  DiscountType,
  User,
} from '@prisma/client';
import { FindOfferDto } from './dto/find-offer.dto';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(private readonly repo: OfferRepository) {}

  async create(createDto: CreateOfferDto, user: User) {
    try {
      const payload: CreateOfferExtraDto = {
        name: createDto.name,
        description: createDto.description ?? null,
        type: createDto.type,
        validFrom: new Date(createDto.validFrom).toISOString(),
        validUpto: new Date(createDto.validUpto).toISOString(),
        discountType: createDto.discountType,
        discountValue: createDto.discountValue ?? null,
        maxDiscountAmount: createDto.maxDiscountAmount ?? null,
        minPurchaseAmount: createDto.minPurchaseAmount ?? null,
        minQuantity: createDto.minQuantity ?? null,
        maxFreeQuantity: createDto.maxFreeQuantity ?? null,
        applicableScope: createDto.applicableScope,
        createdBy: user.id,
        updatedBy: user.id,
        isStackable: createDto.isStackable ?? false,
      };

      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        messge: 'Offer has been created',
        data: await this.repo.create(payload),
      };
    } catch (error) {
      this.logger.error('Service create failed', error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Could not create offer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async findAll(query: FindOfferDto) {
    try {
      const page = query.page && query.page > 0 ? query.page : 1;
      const limit =
        query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
      const skip = (page - 1) * limit;

      const where: Prisma.OfferMasterWhereInput = {};

      if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
      if (query.type) where.type = query.type;
      if (query.discountType) where.discountType = query.discountType;
      if (query.search) {
        where.OR = [
          { name: { contains: query.search.toLowerCase() } },
          { description: { contains: query.search.toLowerCase() } },
        ];
      }

      const [items, total] = await Promise.all([
        this.repo.findAll({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: 'desc' },
        }),
        this.repo.count(where),
      ]);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        messge: 'Offer has been created',
        data: {
          items,
          meta: {
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error('Service findAll failed', error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Failed to fetch offers',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async findById(id: string) {
    try {
      const offer = await this.repo.findById(id);
      if (!offer)
        throw new HttpException('Offer not found', HttpStatus.NOT_FOUND);
      return offer;
    } catch (error) {
      this.logger.error(`Service findById failed for ${id}`, error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Failed to fetch offer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async update(id: string, updateDto: UpdateOfferDto, user: User) {
    try {
      const updateData: UpdateOfferExtrasDto = {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
        ...(updateDto.type !== undefined && { type: updateDto.type }),
        ...(updateDto.validFrom !== undefined && {
          validFrom: `${new Date(updateDto.validFrom)}`,
        }),
        ...(updateDto.validUpto !== undefined && {
          validUpto: `${new Date(updateDto.validUpto)}`,
        }),
        ...(updateDto.discountType !== undefined && {
          discountType: updateDto.discountType,
        }),
        ...(updateDto.discountValue !== undefined && {
          discountValue: updateDto.discountValue,
        }),
        ...(updateDto.maxDiscountAmount !== undefined && {
          maxDiscountAmount: updateDto.maxDiscountAmount,
        }),
        ...(updateDto.minPurchaseAmount !== undefined && {
          minPurchaseAmount: updateDto.minPurchaseAmount,
        }),
        ...(updateDto.minQuantity !== undefined && {
          minQuantity: updateDto.minQuantity,
        }),
        ...(updateDto.maxFreeQuantity !== undefined && {
          maxFreeQuantity: updateDto.maxFreeQuantity,
        }),
        ...(updateDto.applicableScope !== undefined && {
          applicableScope: updateDto.applicableScope,
        }),
        ...(updateDto.isStackable !== undefined && {
          isStackable: updateDto.isStackable,
        }),
        updatedBy: user.id,
      };

      return await this.repo.update(id, updateData);
    } catch (error) {
      this.logger.error(`Service update failed for ${id}`, error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Failed to update offer',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async deleteMany(ids: string[]) {
    try {
      const res = await this.repo.deleteMany(ids);
      return res;
    } catch (error) {
      this.logger.error('Service deleteMany failed', error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Failed to delete offers',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async deactivateMany(ids: string[], updatedBy: string) {
    try {
      return await this.repo.deactivateMany(ids, updatedBy);
    } catch (error) {
      this.logger.error('Service deactivateMany failed', error as any);
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Failed to deactivate offers',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }
}
