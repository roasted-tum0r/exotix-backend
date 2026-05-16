import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLogger } from 'src/common/utils/app.logger';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private prisma: PrismaService) {}

  async upsertInventory(dto: UpdateInventoryDto) {
    try {
      return await this.prisma.inventory.upsert({
        where: {
          itemId_branchId: {
            itemId: dto.itemId,
            branchId: dto.branchId,
          },
        },
        update: {
          quantity: dto.quantity,
          metadata: dto.metadata || {},
        },
        create: {
          itemId: dto.itemId,
          branchId: dto.branchId,
          quantity: dto.quantity,
          metadata: dto.metadata || {},
        },
        include: {
          item: { select: { name: true } },
          branch: { select: { name: true } },
        },
      });
    } catch (error) {
      AppLogger.error(`Failed to upsert inventory: ${error.message}`, error.stack);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Could not update inventory record.',
      });
    }
  }

  async findAll(filters: FilterInventoryDto) {
    try {
      const { itemId, branchId, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      // If branchId is provided, we iterate over all Items and map their branch-specific stock.
      // This ensures all items are visible with stock 0 if not explicitly added.
      if (branchId) {
        const itemWhere: Prisma.ItemWhereInput = { isActive: true };
        if (itemId) itemWhere.id = itemId;

        const [items, total, branch] = await Promise.all([
          this.prisma.item.findMany({
            where: itemWhere,
            skip,
            take: limit,
            include: {
              inventories: {
                where: { branchId },
              },
            },
            orderBy: { name: 'asc' },
          }),
          this.prisma.item.count({ where: itemWhere }),
          this.prisma.branch.findUnique({
            where: { id: branchId },
            select: { id: true, name: true },
          }),
        ]);

        const results = items.map((item) => {
          const inv = item.inventories[0];
          return {
            id: inv?.id || null,
            itemId: item.id,
            branchId: branchId,
            quantity: inv?.quantity || 0,
            metadata: inv?.metadata || {},
            updatedAt: inv?.updatedAt || item.updatedAt,
            item: {
              id: item.id,
              name: item.name,
              price: item.price,
            },
            branch: branch || { id: branchId, name: 'Unknown Branch' },
          };
        });

        return {
          results,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      }

      // Default behavior (Global View): Show existing inventory records across all branches
      const where: Prisma.InventoryWhereInput = {};
      if (itemId) where.itemId = itemId;

      const [results, total] = await Promise.all([
        this.prisma.inventory.findMany({
          where,
          skip,
          take: limit,
          include: {
            item: { select: { id: true, name: true, price: true } },
            branch: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.inventory.count({ where }),
      ]);

      return {
        results,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      AppLogger.error(`Failed to fetch inventory: ${error.message}`, error.stack);
      throw new BadRequestException('Could not retrieve inventory list.');
    }
  }

  async findOne(itemId: string, branchId: string) {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          itemId_branchId: { itemId, branchId },
        },
        include: {
          item: { select: { id: true, name: true, price: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      if (!inventory) {
        const [item, branch] = await Promise.all([
          this.prisma.item.findUnique({ where: { id: itemId } }),
          this.prisma.branch.findUnique({ where: { id: branchId } }),
        ]);

        if (!item) throw new BadRequestException('Item not found');

        return {
          id: null,
          itemId,
          branchId,
          quantity: 0,
          metadata: {},
          updatedAt: item.updatedAt,
          item: { id: item.id, name: item.name, price: item.price },
          branch: branch || { id: branchId, name: 'Unknown Branch' },
        };
      }

      return inventory;
    } catch (error) {
      AppLogger.error(`Failed to fetch inventory item: ${error.message}`, error.stack);
      throw new BadRequestException('Could not retrieve inventory record.');
    }
  }

  async checkStock(itemId: string, branchId: string, requestedQuantity: number) {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: { itemId_branchId: { itemId, branchId } },
      });

      if (!inventory || inventory.quantity < requestedQuantity) {
        return {
          available: false,
          currentStock: inventory?.quantity || 0,
        };
      }

      return {
        available: true,
        currentStock: inventory.quantity,
      };
    } catch (error) {
      AppLogger.error(`Stock check failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to verify stock levels.');
    }
  }

  // Deduct inventory within a transaction
  async deductStockTx(tx: Prisma.TransactionClient, itemId: string, branchId: string, quantity: number) {
    const inventory = await tx.inventory.findUnique({
      where: { itemId_branchId: { itemId, branchId } },
    });

    if (!inventory || inventory.quantity < quantity) {
      throw new BadRequestException(`Insufficient stock for item ${itemId} at branch ${branchId}`);
    }

    return await tx.inventory.update({
      where: { itemId_branchId: { itemId, branchId } },
      data: {
        quantity: { decrement: quantity },
      },
    });
  }

  // Restore inventory within a transaction
  async restoreStockTx(tx: Prisma.TransactionClient, itemId: string, branchId: string, quantity: number) {
    return await tx.inventory.upsert({
      where: { itemId_branchId: { itemId, branchId } },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        itemId,
        branchId,
        quantity,
      },
    });
  }

  // Transfer stock between branches within a transaction
  async transferStockTx(tx: Prisma.TransactionClient, itemId: string, fromBranchId: string, toBranchId: string, quantity: number) {
    // 1. Deduct from source
    await this.deductStockTx(tx, itemId, fromBranchId, quantity);

    // 2. Add to destination (using restoreStockTx as it handles upsert)
    return await this.restoreStockTx(tx, itemId, toBranchId, quantity);
  }
}
