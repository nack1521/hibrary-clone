import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { CategoriesService } from 'src/categories/categories.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    private categoryService: CategoriesService,
    private userService: UserService,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const { categories = [], ...bookData } = createBookDto;

    const validCategories = await Promise.all(
      categories.map(async (categoryId) => {
        const category = await this.categoryService.findOne(categoryId);
        if (!category) {
          throw new Error(`Category with id ${categoryId} not found`);
        }
        return { 
          _id: categoryId, 
          cate_name: category.cate_name };
      }),
    );
    const newBook = new this.bookModel({
      ...bookData,
      categories: validCategories,
    });
    return newBook.save();
  }

  async findAll(): Promise<Book[]> {
    return this.bookModel.find().exec();
  }

  async findOne(id: string): Promise<Book | null> {
    return this.bookModel.findById(id).exec();
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book | null> {
    const { categories = [], ...bookData } = updateBookDto;

    const validCategories = await Promise.all(
      categories.map(async (categoryId) => {
        const category = await this.categoryService.findOne(categoryId);
        if (!category) {
          throw new Error(`Category with id ${categoryId} not found`);
        }
        return { 
          _id: categoryId, 
          cate_name: category.cate_name };
      }),
    );
    const updateBook = this.bookModel.findByIdAndUpdate(
      id, 
      {
        ...bookData, 
        categories: validCategories,
      }, 
      { new: true },
    ).exec();
    return updateBook;
  }

  async remove(id: string) {
    const result = await this.bookModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new Error(`Book with id ${id} not found`);
    }
    return { message: 'Book deleted successfully'};
  }

async getTopBorrowedBooks(limit: number = 10) {
  const books = await this.bookModel
    .find()
    .sort({ book_borrow_count: -1 })
    .limit(limit)
    .populate('categories._id', 'cate_name')
    .exec();

  return {
    success: true,
    data: books,
    total: books.length,
    message: `Top ${limit} most borrowed books retrieved successfully`
  };
}

}
