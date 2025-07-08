import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CategoriesService } from 'src/categories/categories.service';
import { UserService } from 'src/user/user.service';
import { PaginationDto } from './dto/pagination-book.dto';
import { SearchBookDto } from './dto/search-book.dto';

export interface PaginationMeta {
  totalitem: number;
  currentpage: number;
  totalpage: number;
  itemperpage: number;
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
  };
}

export interface PaginatedBooksResponse {
  data: Book[];
  meta: PaginationMeta;
}

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

  async findAllWithPagination(
    searchDto: SearchBookDto,
    searchQuery: any = {}
  ): Promise<PaginatedBooksResponse> {
    const { page = 1, itemlimit = 20 } = searchDto;
    const skip = (page - 1) * itemlimit;

    // Get total count for pagination
    const totalitem = await this.bookModel.countDocuments(searchQuery);
    const totalpage = Math.ceil(totalitem / itemlimit);

    // Get books with pagination
    const books = await this.bookModel
      .find(searchQuery)
      .skip(skip)
      .limit(itemlimit)
      .exec();

    // Build pagination links
    const baseUrl = '/books';
    const buildUrl = (pageNum: number) =>
      `${baseUrl}?itemlimit=${itemlimit}&page=${pageNum}`;

    const meta: PaginationMeta = {
      totalitem,
      currentpage: page,
      totalpage,
      itemperpage: itemlimit,
      links: {
        first: buildUrl(1),
        previous: page > 1 ? buildUrl(page - 1) : null,
        next: page < totalpage ? buildUrl(page + 1) : null,
        last: buildUrl(totalpage),
      },
    };

    return {
      data: books,
      meta,
    };
  }

    async findAllWithPaginationAndParams(searchDto: SearchBookDto): Promise<PaginatedBooksResponse> {
    const { query, book_name, book_author, categories } = searchDto;

    // Build search query
    const searchQuery: any = {};
    if (query) {
      searchQuery.$or = [
        { book_name: { $regex: query, $options: 'i' } },
        { book_author: { $regex: query, $options: 'i' } },
        { book_description: { $regex: query, $options: 'i' } },
      ];
    }
    if (book_name) {
      searchQuery.book_name = { $regex: book_name, $options: 'i' };
    }
    if (book_author) {
      searchQuery.book_author = { $regex: book_author, $options: 'i' };
    }
    if (categories) {
      searchQuery['categories.cate_name'] = { $in: categories };
    }

    // Call the existing findAllWithPagination function
    return this.findAllWithPagination(searchDto, searchQuery);
  }

  async searchBooks(query: string): Promise<Book[]> {
    return this.bookModel.find({
      $or: [
        { book_name: { $regex: query, $options: 'i' } },
        { book_author: { $regex: query, $options: 'i' } }
      ]
    }).populate('categories').exec();
  }

async addFirst10BooksFromGutenberg(limit: number = 1000): Promise<void> {
  try {
    const axios = require('axios');
    const response = await axios.get('https://gutendex.com/books/');
    const books = response.data.results;

    // Limit the number of books
    const limitedBooks = books.slice(0, limit);

    // Define main category mapping
    const mainCategoryMapping: { [key: string]: string } = {
      'fiction': 'Fiction',
      'drama': 'Drama',
      'poetry': 'Poetry',
      'biography': 'Biography',
      'children': 'Children',
      'history': 'History',
      'science': 'Science',
      'philosophy': 'Philosophy',
      'religion': 'Religion',
      'music': 'Music',
      'art': 'Art',
      'humor': 'Humor',
      'travel': 'Travel',
      'war': 'War',
      'adventure': 'Adventure',
      'mystery': 'Mystery',
      'fantasy': 'Fantasy',
    };

    for (const bookData of limitedBooks) {
      const gutenbergCategories = bookData.subjects || [];
      const categoryIds: string[] = [];

      // Map subcategories to main categories
      const mainCategories = new Set<string>();
      for (const categoryName of gutenbergCategories) {
        for (const [key, mainCategory] of Object.entries(mainCategoryMapping)) {
          if (categoryName.toLowerCase().includes(key)) {
            mainCategories.add(mainCategory);
          }
        }
      }

      // Save only main categories
      for (const mainCategory of mainCategories) {
        let category = await this.categoryService.findByName(mainCategory);

        if (!category) {
          category = await this.categoryService.create({ cate_name: mainCategory });
        }

        categoryIds.push((category as any)._id);
      }

      const createBookDto: CreateBookDto = {
        book_name: bookData.title,
        book_author: bookData.authors.map((author: any) => author.name).join(', '),
        book_description: bookData.description || 'No description available.',
        book_cover_image_url: bookData.formats['image/jpeg'] || '',
        book_reader_url: bookData.formats['text/html'] || bookData.formats['application/epub+zip'] || '',
        categories: categoryIds,
        book_borrow_count: 0,
        isAvailable: true,
      };

      const savedBook = await this.create(createBookDto);
      console.log('Book added successfully:', savedBook);
    }
  } catch (error) {
    console.error('Error adding books from Gutenberg:', error);
  }
}

async addRandomBooksFromGutenberg(limit: number = 1000): Promise<void> {
  try {
    const axios = require('axios');
    let allBooks: any[] = [];
    let nextUrl: string | null = 'https://gutendex.com/books/';

    // Fetch books until we have enough or there are no more pages
    while (allBooks.length < limit && nextUrl) {
      const response = await axios.get(nextUrl);
      const data = response.data;

      // Add the books from the current page to the list
      allBooks = allBooks.concat(data.results);

      // Update the next URL for pagination
      nextUrl = data.next;

      console.log(`Fetched ${allBooks.length} books so far...`);
    }

    // Shuffle the books array
    const shuffledBooks = allBooks.sort(() => Math.random() - 0.5);

    // Select a random subset of books
    const randomBooks = shuffledBooks.slice(0, limit);

    // Define main category mapping
    const mainCategoryMapping: { [key: string]: string } = {
      'fiction': 'Fiction',
      'drama': 'Drama',
      'poetry': 'Poetry',
      'biography': 'Biography',
      'children': 'Children',
      'history': 'History',
      'science': 'Science',
      'philosophy': 'Philosophy',
      'religion': 'Religion',
      'music': 'Music',
      'art': 'Art',
      'humor': 'Humor',
      'travel': 'Travel',
      'war': 'War',
      'adventure': 'Adventure',
      'mystery': 'Mystery',
      'fantasy': 'Fantasy',
    };

    for (const bookData of randomBooks) {
      try {
        const gutenbergCategories = bookData.subjects || [];
        const categoryIds: string[] = [];

        // Map subcategories to main categories
        const mainCategories = new Set<string>();
        for (const categoryName of gutenbergCategories) {
          for (const [key, mainCategory] of Object.entries(mainCategoryMapping)) {
            if (categoryName.toLowerCase().includes(key)) {
              mainCategories.add(mainCategory);
            }
          }
        }

        // Save only main categories
        for (const mainCategory of mainCategories) {
          let category = await this.categoryService.findByName(mainCategory);

          if (!category) {
            category = await this.categoryService.create({ cate_name: mainCategory });
          }

          categoryIds.push((category as any)._id);
        }

        // Skip books with missing required fields
        if (!bookData.title || !bookData.authors || bookData.authors.length === 0) {
          console.warn(`Skipping book due to missing required fields: ${bookData.title || 'Unknown Title'}`);
          continue;
        }

        const createBookDto: CreateBookDto = {
          book_name: bookData.title,
          book_author: bookData.authors.map((author: any) => author.name).join(', '),
          book_description: bookData.description || 'No description available.',
          book_cover_image_url: bookData.formats['image/jpeg'] || '',
          book_reader_url: bookData.formats['text/html'] || bookData.formats['application/epub+zip'] || '',
          categories: categoryIds,
          book_borrow_count: 0,
          isAvailable: true,
        };

        const savedBook = await this.create(createBookDto);
        console.log('Book added successfully:', savedBook);
      } catch (bookError) {
        console.error(`Error adding book: ${bookData.title || 'Unknown Title'}`, bookError.message);
        // Skip this book and continue with the next one
      }
    }
  } catch (error) {
    console.error('Error fetching books from Gutenberg:', error);
  }
}

}
