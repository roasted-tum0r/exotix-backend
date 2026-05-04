import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AppDataService } from './app-data.service';
import { CreateAppDataDto } from './dto/create-app-data.dto';
import { UpdateAppDataDto } from './dto/update-app-data.dto';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { OptionalAuthGuard } from 'src/auth/optionalguards/optional-auth.guard';
import { User, UserRole } from '@prisma/client';

@Controller('app-data')
export class AppDataController {
  constructor(private readonly appDataService: AppDataService) {}

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateAppDataDto) {
    return await this.appDataService.create(dto);
  }

  @Patch()
  @Roles('admin')
  async update(@Body() dto: UpdateAppDataDto) {
    return await this.appDataService.update(dto);
  }

  @Public('AppData.get')
  @UseGuards(OptionalAuthGuard)
  @Get()
  async getAppData(@CurrentUser() user?: User) {
    return await this.appDataService.getAppData(user);
  }
}
