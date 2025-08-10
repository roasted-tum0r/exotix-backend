import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/user-role.decorator';
import { AppLogger } from 'src/common/utils/app.logger';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    AppLogger.log(requiredRoles);
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // ✅ If no roles specified → allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // ✅ If user has matching role
    if (requiredRoles.includes(user?.role?.toLowerCase())) return true;

    // ❌ If user is not authorized
    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'You do not have permission to perform this operation.',
    });
  }
}
