import {
  CanActivate,
  ExecutionContext,
  Global,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepository } from 'src/modules/auth/auth.repository';
@Global()
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: any }>();

    const authHeader = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    // 👉 No token → allow request (public behavior)
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userRepo.findByUserId(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 👉 Attach user if valid
      request.user = user;
      return true;
    } catch (err) {
      // 🔥 IMPORTANT DECISION POINT

      // Option A (strict - recommended):
      // If token is provided, it MUST be valid
      throw new UnauthorizedException('Invalid or expired token');

      // Option B (lenient - alternative):
      // Ignore bad token and treat as guest
      // request.user = null;
      // return true;
    }
  }
}