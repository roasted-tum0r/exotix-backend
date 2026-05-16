import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityType, ActorType, EntityType, User } from '@prisma/client';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log({
    type,
    actor,
    entityType,
    entityId,
    meta = {},
    ipAddress,
    userAgent,
  }: {
    type: ActivityType;
    actor: User;
    entityType: EntityType;
    entityId?: string;
    meta?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          type,
          actorType: actor.role as unknown as ActorType,
          actorId: actor.id,
          entityType,
          entityId,
          meta,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      AppLogger.error(`Failed to create activity log: ${error.message}`, error.stack);
    }
  }

  async findAll(filters: {
    type?: ActivityType;
    actorId?: string;
    entityType?: EntityType;
    entityId?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, actorId, entityType, entityId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (actorId) where.actorId = actorId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [results, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
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
  }
}
