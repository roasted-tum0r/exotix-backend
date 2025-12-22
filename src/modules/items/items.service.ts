import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotAcceptableException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto, SearchItemDto } from './dto/filter-item.dto';
import { Prisma, User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { IPagination } from 'src/common/interfaces/app.interface';

@Injectable()
export class ItemsService {
  constructor(private readonly repo: ItemsRepository) {}

  async create(dto: CreateItemDto, user: User) {
    try {
      const payload = await this.repo.create({
        ...dto,
        createdBy: user.id,
        updatedBy: user.id,
      });
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Items were created',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed create item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create item',
      });
    }
  }

  async findAll(filters: FilterItemDto) {
    try {
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Items were fetched',
        data: await this.repo.findAll(filters),
      };
    } catch (error) {
      AppLogger.error(`Failed search and filter item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to search and filter item',
      });
    }
  }
  async getAllItemsService(paginatinObject: SearchItemDto) {
    try {
      const whereClause = this.buildItemWhere({
        categoryIds: paginatinObject.categoryIds,
        isAvailable: paginatinObject.isAvailable,
        maxPrice: paginatinObject.maxPrice,
        minPrice: paginatinObject.minPrice,
        search: paginatinObject.search,
      });
      const payload = await this.repo.findAllItems(
        paginatinObject,
        whereClause,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Items list was fetched',
        data: payload,
      };
    } catch (error) {
      AppLogger.error(`Failed search and filter item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to search and filter item',
      });
    }
  }

  async findOne(id: string) {
    try {
      const payload = await this.repo.findOne(id);
      if (!payload)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item not found',
        });
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Items details were fetched',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed fetch Item details`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch Item details',
      });
    }
  }

  async update(id: string, dto: UpdateItemDto, user: User) {
    try {
      const payload = await this.repo.update(id, {
        ...dto,
        updatedBy: user.id,
      });
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Item was updated',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed update item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update item',
      });
    }
  }

  async remove(id: string[] | string) {
    try {
      const ids = Array.isArray(id) ? id : [id];
      const AddedItems = await this.repo.findBulk(ids);
      const itemsInCarts = AddedItems.filter(
        (item) => item.cartItems.length > 0,
      );
      if (itemsInCarts.length > 0)
        throw new PreconditionFailedException({
          statusCode: HttpStatus.PRECONDITION_FAILED,
          error: true,
          message: `The items you're trying to deactivate are already part of customer carts. This would cause business issue. For business wellfare you can only deactivate not added items.`,
          blockedItemIds: itemsInCarts,
        });
      const payload = await this.repo.remove(ids);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Item was deactivted',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed deactivate item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to deactivate item',
      });
    }
  }

  async addToFavourite(userId: string, itemId: string) {
    try {
      const payload = await this.repo.addToFavourite(userId, itemId);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item added to favourites',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed to add item to favourites`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add item to favourites',
      });
    }
  }

  async addToWishlist(userId: string, itemId: string) {
    try {
      const payload = await this.repo.addToWishlist(userId, itemId);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Item added to wishlist',
        data: {
          ...payload,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed to add item to wishlist`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to add item to wishlist',
      });
    }
  }

  // helper to build the where clause
  private buildItemWhere(filters: FilterItemDto): Prisma.ItemWhereInput {
    const { search, categoryIds, isAvailable } = filters || {};
    // minPrice/maxPrice may come as string (query params) or number
    const { minPrice, maxPrice } = filters || {};

    const where: Prisma.ItemWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search.toLowerCase(),
          } as Prisma.StringFilter<'Item'>,
        },
        {
          description: {
            contains: search.toLowerCase(),
          } as Prisma.StringFilter<'Item'>,
        },
      ];
    }

    if (categoryIds && categoryIds.length) {
      where.categoryId = { in: [...categoryIds] as any };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    const parseNumberSafe = (v?: string | number): number | undefined => {
      if (v === undefined || v === null) return undefined;
      // if already a number
      if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
      // parse string to float
      const n = parseFloat(String(v));
      return Number.isFinite(n) ? n : undefined;
    };

    const parsedMin = parseNumberSafe(minPrice);
    const parsedMax = parseNumberSafe(maxPrice);

    if (parsedMin !== undefined || parsedMax !== undefined) {
      where.price = {
        ...(parsedMin !== undefined
          ? { gte: new Prisma.Decimal(parsedMin) }
          : {}),
        ...(parsedMax !== undefined
          ? { lte: new Prisma.Decimal(parsedMax) }
          : {}),
      } as any;
    }

    return where;
  }
}
