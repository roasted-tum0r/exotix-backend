import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PingService } from './ping.service';
import { CreatePingDto } from './dto/create-ping.dto';
import { UpdatePingDto } from './dto/update-ping.dto';

@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Post()
  create(@Body() createPingDto: CreatePingDto) {
    return this.pingService.create(createPingDto);
  }

  @Get()
  findAll() {
    return this.pingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePingDto: UpdatePingDto) {
    return this.pingService.update(+id, updatePingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pingService.remove(+id);
  }
}
