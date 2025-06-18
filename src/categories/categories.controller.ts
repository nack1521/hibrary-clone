import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT auth and roles guard to all routes
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles("admin") // Only admin can create categories
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Roles("admin","user") // Both admin and user can view categories
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Roles("admin","user") // Both admin and user can view single category
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles("admin") // Only admin can update categories
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles("admin") // Only admin can delete categories
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
