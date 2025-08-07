import { Injectable } from '@nestjs/common';
import { CreatePingDto } from './dto/create-ping.dto';
import { UpdatePingDto } from './dto/update-ping.dto';

@Injectable()
export class PingService {
  create(createPingDto: CreatePingDto) {
    return 'This action adds a new ping';
  }

  findAll() {
    return `This action returns all ping`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ping`;
  }

  update(id: number, updatePingDto: UpdatePingDto) {
    return `This action updates a #${id} ping`;
  }

  remove(id: number) {
    return `This action removes a #${id} ping`;
  }
}
