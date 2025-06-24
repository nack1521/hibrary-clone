import { Controller, Get, Post, Request, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(RefreshAuthGuard)
  @Post("refresh")
  refreshToken(@Req() req){
    return this.authService.refreshToken(req.user); 
  }
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request) {
    console.log('Auth Controller - Profile request.user:', request.user);
    return {
      message: 'Profile retrieved successfully',
      user: request.user
    };
}
}
