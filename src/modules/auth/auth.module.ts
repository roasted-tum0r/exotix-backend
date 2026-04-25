import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './auth.repository';
import { UploadRepo } from '../image-upload/upload.repo';
import { CloudinaryService } from 'src/config/cloudinary/cloudinary.service';

@Module({
imports: [
  JwtModule.register({
    secret: process.env.JWT_SECRET ?? 'default_secret',
    signOptions: { expiresIn: '10m' },
  }),
],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, UserRepository, UploadRepo, CloudinaryService],
  exports: [UserRepository, JwtModule],
})
export class AuthModule {}
