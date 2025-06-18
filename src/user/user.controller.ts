import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request, 
  UnauthorizedException, 
  NotFoundException 
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  create(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.create(registerUserDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedException('User not authenticated or email not found in token');
    }
    const user = await this.userService.findByEmail(req.user.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('/admin')
  async adminOnly() {
    return { message: 'Admin content' };
  }
}
