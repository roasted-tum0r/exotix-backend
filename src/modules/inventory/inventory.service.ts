import { Injectable } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { MailService } from 'src/services/mail/mailservice.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityType, ActorType, EntityType, User, UserRole } from '@prisma/client';
import { Templates } from 'src/config/templates/template';
import { AppLogger } from 'src/common/utils/app.logger';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async updateStock(dto: UpdateInventoryDto, adminUser: User) {
    try {
      const result = await this.repository.upsertInventory(dto);

      // Audit Log
      this.activityLogService.log({
        type: ActivityType.INVENTORY_UPDATED,
        actor: adminUser,
        entityType: EntityType.INVENTORY,
        entityId: result.itemId,
        meta: {
          action: 'UPDATE',
          branchId: dto.branchId,
          newQuantity: dto.quantity,
          metadata: dto.metadata,
        },
      });

      // Notify all admins about the change
      this.notifyAdmins(result, adminUser).catch((err) =>
        AppLogger.error(`Failed to notify admins: ${err.message}`, err.stack),
      );

      return result;
    } catch (error) {
      AppLogger.error(`Inventory update failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async transferStock(dto: TransferInventoryDto, adminUser: User) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        return await this.repository.transferStockTx(
          tx,
          dto.itemId,
          dto.fromBranchId,
          dto.toBranchId,
          dto.quantity,
        );
      });

      // Audit Log
      this.activityLogService.log({
        type: ActivityType.INVENTORY_UPDATED,
        actor: adminUser,
        entityType: EntityType.INVENTORY,
        entityId: dto.itemId,
        meta: {
          action: 'TRANSFER',
          fromBranchId: dto.fromBranchId,
          toBranchId: dto.toBranchId,
          quantity: dto.quantity,
        },
      });

      return result;
    } catch (error) {
      AppLogger.error(`Stock transfer failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInventoryList(filters: FilterInventoryDto) {
    try {
      return await this.repository.findAll(filters);
    } catch (error) {
      AppLogger.error(`Failed to get inventory list: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInventoryItem(itemId: string, branchId: string) {
    try {
      return await this.repository.findOne(itemId, branchId);
    } catch (error) {
      AppLogger.error(`Failed to get inventory item: ${error.message}`, error.stack);
      throw error;
    }
  }



  private async notifyAdmins(inventoryRecord: any, updatedBy: User) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { email: true },
      });

      if (!admins.length) return;

      const adminEmails = admins.map((a) => a.email);
      const html = Templates.inventoryUpdateEmail({
        itemName: inventoryRecord.item.name,
        branchName: inventoryRecord.branch.name,
        quantity: inventoryRecord.quantity,
        updatedBy: `${updatedBy.firstname} ${updatedBy.lastname || ''}`.trim(),
        type: 'UPDATE',
      });

      await Promise.all(
        adminEmails.map((email) =>
          this.mailService.sendMail(
            `Anandini Inventory <info@anandini.org.in>`,
            email,
            `Inventory Alert: ${inventoryRecord.item.name} Updated`,
            html,
          ),
        ),
      );
    } catch (error) {
      AppLogger.error(`Admin notification failed: ${error.message}`, error.stack);
    }
  }
}
