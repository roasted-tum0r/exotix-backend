import {
  Injectable,
  HttpException,
  HttpStatus,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AddressRepository } from './address.repository';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DeleteAddressDto } from './dto/delete-address.dto';
import { AppLogger } from 'src/common/utils/app.logger';
import { IPagination } from 'src/common/interfaces/app.interface';
import { User } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private readonly repo: AddressRepository) {}

  async create(user: User, dto: CreateAddressDto) {
    try {
      AppLogger.log(`Creating address for userId=${user.id}`);

      const duplicate = await this.repo.findDuplicate(user.id, dto);
      if (duplicate) {
        AppLogger.warn(`Duplicate address found for userId=${user.id}`);
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: `Address already exists`,
        });
      }
      if (dto.isDefault) {
        const existingDefault = await this.repo.findDefault(user.id);
        if (existingDefault) {
          AppLogger.warn(
            `Default address already exists for userId=${user.id}`,
          );
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: true,
            message: `User already has a default address`,
          });
        }
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `User address created`,
        data: await this.repo.create(user.id, dto),
      };
    } catch (error) {
      AppLogger.error('Failed to create address', error.stack);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException({
            message: 'Failed to add address',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: true,
          });
    }
  }

  async findById(id: string) {
    try {
      AppLogger.log(`Fetching address id=${id}`);
      const address = await this.repo.findById(id);
      if (!address) {
        throw new NotFoundException({
          message: 'Address not found',
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
        });
      }
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `User address fetched`,
        data: address,
      };
    } catch (error) {
      AppLogger.error(`Failed to fetch address id=${id}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException({
            message: 'Failed to fetch address by id',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: true,
          });
    }
  }

  async findMany(user: User, paginatinObject: IPagination) {
    try {
      AppLogger.log(
        `Fetching addresses for user.id=${user.id}, page=${paginatinObject.page}, limit=${paginatinObject.limit}`,
      );
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `User addresses fetched`,
        data: await this.repo.findManyByUser(user.id, paginatinObject),
      };
    } catch (error) {
      AppLogger.error(
        `Failed to fetch addresses for user.id=${user.id}`,
        error.stack,
      );
      throw new InternalServerErrorException({
        message: 'Failed to fetch address',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
      });
    }
  }

  async update(id: string, dto: UpdateAddressDto) {
    try {
      AppLogger.log(`Updating address id=${id}`);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `User address updated`,
        data: await this.repo.update(id, dto),
      };
    } catch (error) {
      AppLogger.error(`Failed to update address id=${id}`, error.stack);
      throw new InternalServerErrorException({
        message: 'Failed to update address',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
      });
    }
  }

  async delete(dto: DeleteAddressDto) {
    try {
      AppLogger.log(`Deleting addresses: ${dto.ids.join(', ')}`);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `User addresses deleted`,
        data: await this.repo.deleteMany(dto.ids),
      };
    } catch (error) {
      AppLogger.error('Failed to delete addresses', error.stack);
      throw new InternalServerErrorException({
        message: 'Failed to delete address',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
      });
    }
  }
}
