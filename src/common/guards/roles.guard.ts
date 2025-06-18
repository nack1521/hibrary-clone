import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RolesGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = await this.userService.findByEmail(request.user.email);
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}