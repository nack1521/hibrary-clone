import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request, 
  UnauthorizedException, 
  NotFoundException, 
  Patch,
  Delete,
  Param
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

  @Roles('admin')
  @Patch()
  async updateUser(@Request() req, @Body() updateData: Partial<RegisterUserDto>) {
    console.log('user:', req.user);
    console.log('user id:', req.user.id);
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    const updatedUser = await this.userService.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }


  @Roles('admin')
  @Delete()
  async deleteUser(@Request() req) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    try {
      const result = await this.userService.deleteUser(userId);
      return result; // Returns { message: 'User deleted successfully' }
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  @Roles('admin')
  @Get('all')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Roles('admin')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Roles('admin')
  @Patch(':id')
  async updateUserById(@Param('id') id: string, @Body() updateData: Partial<RegisterUserDto>) {
    const updatedUser = await this.userService.updateUser(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }
  
  @Roles('admin')
  @Delete(':id')
  async deleteUserById(@Param('id') id: string) {
    const deletedUser = await this.userService.deleteUser(id);
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}
