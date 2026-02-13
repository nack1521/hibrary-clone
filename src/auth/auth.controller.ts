import { Controller, Get, Post, Request, UseGuards, Res, Req, HttpException, HttpStatus, Put, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  @Post('logout')
  async logout(@Request() req) {
    try {
      const userId = req.user.sub;
      await this.authService.logout(userId);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: 'Logout failed'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'user')
  @Put('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto, 
    @Req() req
  ) {
    const userId = req.user?.id || req.user?._id;
    return this.authService.changePassword(
      userId,
      changePasswordDto.oldPassword, 
      changePasswordDto.newPassword);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto){
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }
}
