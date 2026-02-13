import { Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service'; // Adjust the import path as necessary
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { ResetToken } from './schemas/reset-token.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from './services/mail.service';

@Injectable()
export class AuthService {
  
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    private mailService: MailService,

  ) {}
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (user && await bcrypt.compare(password, user.password)) {
      const result = user.toObject(); // Convert Mongoose document to plain object
      return {
        email: result.email,
        userId: result._id, // Assuming you want to return the user ID
        roles: result.roles,
      }
    }
    return null;
  }
  async login(user: any) {
    const payload = { 
      sub: user.userId,           // Standard JWT field for user ID
      email: user.email,
      roles: user.roles,
    };
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

  async logout(userId: any) {
    // Remove refresh token from database
    await this.userService.updateRefreshToken(userId, null);
  }


  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }
    user.password = newPassword;
    
    return await user.save();
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const resetToken = nanoid(64);
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Token valid for 1 hour
      await this.ResetTokenModel.create({
        userId: user._id,
        token: resetToken,
        expiresAt: expiryDate
      });

      this.mailService.sendPasswordResetEmail(email, resetToken);
    }
  }

  async resetPassword(newPassword: string, resetToken: string) {
    //Find a valid reset token document
    const token = await this.ResetTokenModel.findOneAndDelete({
      token: resetToken,
      expiresAt: { $gte: new Date() }, // Changed from expiryDate to expiresAt
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }

    //Change user password (MAKE SURE TO HASH!!)
    const user = await this.userService.findById(token.userId.toString());
    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = newPassword;
    await user.save();
  }

}
