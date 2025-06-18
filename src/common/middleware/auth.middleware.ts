import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    // 1. Extract Bearer token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      
      try {
        // 2. Verify and decode JWT token
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET') || 'default-secret-key',
        });
        
        // 3. Attach user info to request object
        req.user = { userId: payload.sub, email: payload.email };
      } catch (error) {
        // 4. If token is invalid, continue without user (don't throw error)
        // Let Guards handle authentication requirements
      }
    }
    
    // 5. Continue to next middleware/guard/handler
    next();
  }
}