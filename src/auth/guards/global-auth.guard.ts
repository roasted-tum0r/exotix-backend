import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { ReqAuth } from 'src/common/interfaces/request.interface';
import { AppLogger } from 'src/common/utils/app.logger';
import { UserRepository } from 'src/modules/auth/auth.repository';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<ReqAuth>();
    const authHeader = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    AppLogger.log('🔐 Auth Guard →', {
      handler: context.getHandler().name,
      controller: context.getClass().name,
      isPublic,
      tokenProvided: !!token,
    });

    // ✅ Case 1: Public Route — allow access without auth
    if (isPublic) {
      return true;
    }

    // 🔒 Case 2: Protected Route — token required
    if (!token) {
      throw new UnauthorizedException('Token required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepo.findByUserId(payload.sub);

      if (!user) throw new UnauthorizedException('User not found');

      // Attach the user to request for downstream access
      request.user = user;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
