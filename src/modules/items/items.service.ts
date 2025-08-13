import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto } from './dto/filter-item.dto';
import { User } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(private readonly repo: ItemsRepository) {}

  async create(dto: CreateItemDto, user: User) {
    return this.repo.create({
      ...dto,
      createdBy: user.id, 
      updatedBy: user.id
    });
  }

  async findAll(filters: FilterItemDto) {
    return this.repo.findAll(filters);
  }

  async findOne(id: number) {
    const item = await this.repo.findOne(id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(id: number, dto: UpdateItemDto, user: User) {
    return this.repo.update(id, { ...dto, updatedBy: user.id });
  }

  async remove(id: number) {
    return this.repo.remove(id);
  }
}
