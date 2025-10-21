import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PingService } from './ping.service';
import { CreatePingDto } from './dto/create-ping.dto';
import { UpdatePingDto } from './dto/update-ping.dto';
import { Public } from 'src/common/decorators/public.decorator';
@Public('Healthcheck Endpoint')
@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) { }
  @Get('/health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date() };
  }
}
