import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './auth.repository';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'default_secret', // better from .env
      signOptions: { expiresIn: process.env.JWT_EXPIRY ?? '1d' }, // or '3600s'
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService,PrismaService, UserRepository],
  exports:[UserRepository,JwtModule],
})
export class AuthModule {}
