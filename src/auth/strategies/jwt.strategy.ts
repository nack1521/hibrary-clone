import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService, ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) 
  {
    
    if (!jwtConfiguration.secret) {
      throw new Error('JWT secret is not defined in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret, // Use the secret from environment variables
      ignoreExpiration: false, // Ensure that the token expiration is checked
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}