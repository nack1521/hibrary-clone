import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import refreshJwtConfig from './config/refresh-jwt.config';
import jwtConfig from './config/jwt.config';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    UserModule, 
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshJwtStrategy],
})
export class AuthModule {}
