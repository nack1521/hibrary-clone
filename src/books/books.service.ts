import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CategoriesService } from 'src/categories/categories.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
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
  async incrementBorrowCount(bookId: string): Promise<void> {
    await this.bookModel.findByIdAndUpdate(
      bookId,
      { $inc: { book_borrow_count: 1 } }
    );
  }


  async cleanupUserExpiredTokens(userId: string): Promise<{ cleaned: number; remaining: any[] }> {
    try {
      console.log('Starting cleanup for user:', userId);
      console.log('Current time:', new Date());
      
      // Find all expired transactions for this user
      const expiredTransactions = await this.transactionModel.find({
        userId: new Types.ObjectId(userId), // Make sure userId is properly converted
        isActive: true,
        expiresAt: { $lt: new Date() }
      }).populate('bookId');

      console.log('Found expired transactions:', expiredTransactions.length);

      let cleaned = 0;

      // Clean up expired tokens
      for (const transaction of expiredTransactions) {
        try {
          console.log('Cleaning up transaction:', transaction.token);
          
          // Remove book from user's books array
          const removeResult = await this.userService.removeBorrowedBook(userId, transaction.token);
          console.log('Remove result:', removeResult);

          // Set transaction as inactive
          await this.transactionModel.updateOne(
            { _id: transaction._id },
            { isActive: false }
          );

          cleaned++;
        } catch (error) {
          console.error('Error cleaning up transaction:', error);
          continue;
        }
      }

      // Get remaining active (non-expired) borrowed books for the user
      const remainingTransactions = await this.transactionModel.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).populate('bookId');

      console.log('Cleaned:', cleaned, 'Remaining:', remainingTransactions.length);

      return {
        cleaned,
        remaining: remainingTransactions
      };
    } catch (error) {
      console.error('Error in cleanupUserExpiredTokens:', error);
      return { cleaned: 0, remaining: [] };
    }
  }

  async getUserBorrowedBooks(userId: string) {
    // First cleanup expired tokens
    const cleanupResult = await this.cleanupUserExpiredTokens(userId);
    
    // Return the remaining active borrowed books with additional info
    const borrowedBooks = cleanupResult.remaining.map(transaction => ({
      book: transaction.bookId,
      token: transaction.token,
      borrowedAt: transaction.borrowedAt,
      expiresAt: transaction.expiresAt,
    }));

    return {
      borrowedBooks,
      cleanedExpiredTokens: cleanupResult.cleaned,
    };
  }

  async searchBooks(query: string): Promise<Book[]> {
    return this.bookModel.find({
      $or: [
        { book_name: { $regex: query, $options: 'i' } },
        { book_author: { $regex: query, $options: 'i' } }
      ]
    }).populate('categories').exec();
  }
}
