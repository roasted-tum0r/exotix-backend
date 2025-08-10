import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
@Injectable()
export class ItemCategoryRepo {
  constructor(private readonly prismaService: PrismaService) {}
  async addCategory(
    data: CreateItemCategoryDto | CreateItemCategoryDto[],
    userId: number,
  ) {
    try {
      if (Array.isArray(data)) {
        const bulkData = data.map((d) => ({
          ...d,
          createdBy: userId,
          updatedBy: userId, // first update = creator, // pass FK directly
        }));

        await this.prismaService.categoryMaster.createMany({
          data: bulkData,
          skipDuplicates: true,
        });
        return this.prismaService.categoryMaster.findMany({
          where: { createdBy: userId },
          orderBy: { id: 'desc' }, // newest first
          take: bulkData.length,
          select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count:true,
          user:true
        },
        });
      } else
        return await this.prismaService.categoryMaster.create({
          data: {
            ...data,
            createdBy: userId,
            updatedBy: userId, // first update = creator, // pass FK directly
          },
          select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count:true,
          user:true
        },
        });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async getAllCategories() {
    try {
      return await this.prismaService.categoryMaster.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count:true,
          user:true
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async getCategoryById(id: number) {
    try {
      return await this.prismaService.categoryMaster.findUnique({
        where: { id, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async updateCategory(id: number, data: UpdateItemCategoryDto) {
    try {
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
  async deleteCategory(id: number) {
    try {
      await this.getCategoryById(id); // check if exists
      return await this.prismaService.categoryMaster.update({
        where: { id, isActive: true },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: 'Something went wrong.',
      });
    }
  }
}
