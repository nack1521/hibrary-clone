import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Model } from 'mongoose';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel : Model<CategoryDocument>
  ) {}
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const result = new this.categoryModel(createCategoryDto);
    return result.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoryModel.findById(id).exec();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    const result = this.categoryModel.findByIdAndUpdate(
      id, updateCategoryDto, { new: true }
    ).exec();
    return result;
  }

  async remove(id: string) {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new Error(`Category with id ${id} not found`);
    }
    return { message : 'Category deleted successfully'};
  }
}
