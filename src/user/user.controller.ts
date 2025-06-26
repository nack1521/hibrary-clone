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
  Param,
  Query
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
  async softDeleteUser(@Request() req) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    try {
      const result = await this.userService.softDeleteUser(userId, req.user.email);
      return { 
        message: 'User deleted successfully',
        deletedUser: result
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  @Roles('admin')
  @Get('all')
  async getAllUsers(@Query('includeDeleted') includeDeleted?: string) {
    if (includeDeleted === 'true') {
      return this.userService.getAllUsersIncludingDeleted();
    }
    return this.userService.getAllUsers();
  }

  @Roles('admin')
  @Get('deleted')
  async getDeletedUsers() {
    return this.userService.getDeletedUsers();
  }

  @Roles('admin')
  @Get(':id')
  async getUserById(@Param('id') id: string, @Query('includeDeleted') includeDeleted?: string) {
    let user;
    if (includeDeleted === 'true') {
      user = await this.userService.userExists(id) 
        ? await this.userService.getAllUsersIncludingDeleted().then(users => users.find(u => (u as any).id?.toString() === id))
        : null;
    } else {
      user = await this.userService.findById(id);
    }
    
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
  async softDeleteUserById(@Param('id') id: string, @Request() req) {
  try {
    // Handle case where req.user might be undefined
    const deletedBy = req.user?.email || req.user?.id || 'admin';
    
    const deletedUser = await this.userService.softDeleteUser(id, deletedBy);
    
    return { 
      message: 'User deleted successfully',
      deletedUser
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new NotFoundException('User not found');
  }
}

  @Roles('admin')
  @Post(':id/restore')
  async restoreUser(@Param('id') id: string) {
    try {
      const restoredUser = await this.userService.restoreUser(id);
      return {
        message: 'User restored successfully',
        restoredUser
      };
    } catch (error) {
      throw new NotFoundException('User not found or not deleted');
    }
  }

  @Roles('admin')
  @Delete(':id/permanent')
  async hardDeleteUser(@Param('id') id: string) {
    const deletedUser = await this.userService.deleteUser(id);
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return { 
      message: 'User permanently deleted',
      deletedUser
    };
  }
}
