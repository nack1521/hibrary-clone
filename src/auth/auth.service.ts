import { Inject, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service'; // Adjust the import path as necessary
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,

  ) {}
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.password)) {
      const result = user.toObject(); // Convert Mongoose document to plain object
      return {
        email: result.email,
        userId: result._id, // Assuming you want to return the user ID
      }
    }
    return null;
  }
  async login(user: any) {
    const payload = { email: user.email, sub: user.userId };
    const token = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, this.refreshTokenConfig);
    return {
      accessToken: token, 
      refreshToken: refreshToken,
    }
  }

  refreshToken(user: any) {
    const payload = { email: user.email, sub: user.userId };
    const token = this.jwtService.sign(payload)
    return {
      accessToken: token,
    }
  }
}
