import { Injectable } from '@nestjs/common';
import { CreateItemDto, CreateItemRepoDto } from './dto/create-item.dto';
import { UpdateItemDto, UpdateItemRepoDto } from './dto/update-item.dto';
import { FilterItemDto } from './dto/filter-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateItemRepoDto) {
    return this.prisma.item.create({ data });
  }

  async findAll(filters: FilterItemDto) {
    const { search, categoryId, isAvailable, minPrice, maxPrice } = filters;

    return this.prisma.item.findMany({
      where: {
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              } as Prisma.StringFilter<'Item'>,
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              } as Prisma.StringFilter<'Item'>,
            },
          ],
        }),
        ...(categoryId && { categoryId }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(minPrice !== undefined || maxPrice !== undefined
          ? { price: { gte: minPrice ?? 0, lte: maxPrice ?? undefined } }
          : {}),
      },
      include: { category: true, images: true, reviews: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.item.findUnique({
      where: { id },
      include: { category: true, images: true, reviews: true },
    });
  }

  async update(id: number, data: UpdateItemRepoDto) {
    return this.prisma.item.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
