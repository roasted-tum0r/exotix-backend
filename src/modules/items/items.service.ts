import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto, RecommendationPaginationDto, SearchItemDto } from './dto/filter-item.dto';
import { ImageOwnerType, User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';
import { UploadRepo } from '../image-upload/upload.repo';


@Injectable()
export class ItemsService {
  constructor(private readonly repo: ItemsRepository, private readonly uploadRepo: UploadRepo) { }

  async create(dto: CreateItemDto, user: User) {
    try {
      const { thumbnailImage, galleryImages, ...createDto } = dto;
      const payload = await this.repo.create({
        ...createDto,
        createdBy: user.id,
        updatedBy: user.id,
      });
      if (thumbnailImage) {
        await this.uploadRepo.addImages(payload.id, [thumbnailImage], ImageOwnerType.ITEM_THUMBNAIL);
      }
      if (galleryImages?.length) {
        await this.uploadRepo.addImages(payload.id, galleryImages, ImageOwnerType.ITEM_GALLERY);
      }
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

  async getSuggestionsService(search?: string) {
    try {
      if (!search || search.trim().length === 0) {
        const items = await this.repo.getLatestItems();
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: 'Latest items returned',
          data: { items, categories: [] },
        };
      }
      const data = await this.repo.getSuggestions(search.trim());
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Suggestions fetched',
        data,
      };
    } catch (error) {
      AppLogger.error(`Failed to fetch suggestions`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch suggestions',
      });
    }
  }

  async getAllItemsService(paginatinObject: SearchItemDto, user?: User) {
    try {
      const whereClause = this.repo.buildItemWhere({
        categoryIds: paginatinObject.categoryIds,
        isAvailable: paginatinObject.isAvailable,
        maxPrice: paginatinObject.maxPrice,
        minPrice: paginatinObject.minPrice,
        search: paginatinObject.search,
      }, user);
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

  async findOne(id: string, user?: User) {
    try {
      const payload = await this.repo.findOne(id, user);
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
      const { thumbnailImage, galleryImages, deletedImagePublicIds, ...updateDto } = dto;
      
      const payload = await this.repo.update(id, {
        ...updateDto,
        updatedBy: user.id,
      });

      if (deletedImagePublicIds && deletedImagePublicIds.length > 0) {
        await this.uploadRepo.deleteImages(deletedImagePublicIds);
      }

      if (thumbnailImage) {
        await this.uploadRepo.addImages(id, [thumbnailImage], ImageOwnerType.ITEM_THUMBNAIL);
      }

      if (galleryImages && galleryImages.length > 0) {
        await this.uploadRepo.addImages(id, galleryImages, ImageOwnerType.ITEM_GALLERY);
      }

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

  async restoreItem(id: string) {
    try {
      const payload = await this.repo.restoreItem(id);
      if (!payload)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item not found',
        });
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Item was restored',
        data: { ...payload },
      };
    } catch (error) {
      AppLogger.error(`Failed to restore item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to restore item',
      });
    }
  }

  async hardDeleteItem(id: string) {
    try {
      // Purge thumbnail + gallery images from Cloudinary and image DB first
      await this.uploadRepo.purgeImagesByRef(id, [
        ImageOwnerType.ITEM_THUMBNAIL,
        ImageOwnerType.ITEM_GALLERY,
      ]);
      await this.repo.hardDeleteItem(id);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Item was permanently deleted',
        data: { id },
      };
    } catch (error) {
      AppLogger.error(`Failed to hard-delete item`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to permanently delete item',
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


  /**
   * GET /items/:id/similar
   * Same-category items — fully paginated.
   */
  async getSimilarItems(itemId: string, pagination: RecommendationPaginationDto) {
    try {
      const item = await this.repo.findOne(itemId);
      if (!item)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item not found',
        });
      const { results, total } = await this.repo.getSimilarItems(itemId, item.categoryId, pagination);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Similar items fetched',
        data: {
          results,
          meta: {
            total,
            currentPage: +pagination.page,
            totalPages: Math.ceil(total / +pagination.limit),
          },
        },
      };
    } catch (error) {
      AppLogger.error('Failed to fetch similar items', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch similar items',
      });
    }
  }

  /**
   * GET /items/:id/also-like
   * Items in a ±30% price range — fully paginated.
   */
  async getAlsoLikeItems(itemId: string, pagination: RecommendationPaginationDto) {
    try {
      const item = await this.repo.findOne(itemId);
      if (!item)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: true,
          message: 'Item not found',
        });
      const { results, total } = await this.repo.getAlsoLikeItems(itemId, item.price, pagination);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Items you may like fetched',
        data: {
          results,
          meta: {
            total,
            currentPage: +pagination.page,
            totalPages: Math.ceil(total / +pagination.limit),
          },
        },
      };
    } catch (error) {
      AppLogger.error('Failed to fetch also-like items', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch items you may like',
      });
    }
  }

  /**
   * GET /items/:id/also-bought
   * Co-purchased items ranked by frequency — fully paginated.
   */
  async getAlsoBoughtItems(itemId: string, pagination: RecommendationPaginationDto) {
    try {
      const { results, total } = await this.repo.getAlsoBoughtItems(itemId, pagination);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'People also bought fetched',
        data: {
          results,
          meta: {
            total,
            currentPage: +pagination.page,
            totalPages: Math.ceil(total / +pagination.limit),
          },
        },
      };
    } catch (error) {
      AppLogger.error('Failed to fetch also-bought items', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to fetch people also bought',
      });
    }
  }
  async moveItems(itemIds: string[], categoryId: string) {
    try {
      return await this.repo.moveItems(itemIds, categoryId);
    } catch (error) {
      AppLogger.error('Failed to move items', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to move items',
      });
    }
  }
  async deleteByCategory(categoryId: string) {
    try {
      return await this.repo.deleteByCategory(categoryId);
    } catch (error) {
      AppLogger.error('Failed to delete by category items', error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete by category items',
      });
    }
  }
}
