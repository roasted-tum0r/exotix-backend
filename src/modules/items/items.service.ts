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
import { FilterItemDto } from './dto/filter-item.dto';
import { User } from '@prisma/client';
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
        data:
          {
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
      const payload = await this.repo.findAll(filters);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Items were fetched',
        data:
          // Array.isArray(payload)
          //   ?
          payload.map((r) => ({
            ...r,
          })),
        //   :
        // {
        //   ...payload,
        // },
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
  async getAllItemsService(paginatinObject: IPagination) {
    try {
      const payload = await this.repo.getAllItemsRepo(paginatinObject);
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: 'Items list was fetched',
        data: {
          ...payload,
          results: payload.results.map((r) => ({
            ...r,
          })),
        },
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
        statusCode: HttpStatus.CREATED,
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
        statusCode: HttpStatus.CREATED,
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
        statusCode: HttpStatus.CREATED,
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
}
