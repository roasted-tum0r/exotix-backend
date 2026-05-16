import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { RolesGuard } from 'src/auth/guards/role-auth.guard';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { ActivityType, EntityType } from '@prisma/client';

@Controller('activity-logs')
@UseGuards(RolesGuard)
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Roles('admin')
  @Get()
  async getLogs(
    @Query('type') type?: ActivityType,
    @Query('actorId') actorId?: string,
    @Query('entityType') entityType?: EntityType,
    @Query('entityId') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.service.findAll({
      type,
      actorId,
      entityType,
      entityId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }
}
