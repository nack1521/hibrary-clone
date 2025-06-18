import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService, ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { ref } from 'process';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy,"refresh-jwt") {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
  ) 
  {
    
    if (!refreshJwtConfiguration.secret) {
      throw new Error('JWT secret is not defined in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshJwtConfiguration.secret, // Use the secret from environment variables
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}