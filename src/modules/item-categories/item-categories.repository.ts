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
  async addCategory(data: CreateItemCategoryDto | CreateItemCategoryDto[]) {
    try {
      if (Array.isArray(data))
        return await this.prismaService.categoryMaster.createMany({
          data,
        });
      else return await this.prismaService.categoryMaster.create({ data });
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
        where: { id, isActive:true },
        data,
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
        where: { id, isActive:true },
        data: {
          isActive: false,
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
