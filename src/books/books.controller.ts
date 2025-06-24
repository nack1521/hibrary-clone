import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BookTokenGuard } from '../common/guards/book-token.guard';
import { TransactionsService } from '../transactions/transactions.service';
import { UserService } from 'src/user/user.service';

@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly transactionsService: TransactionsService,
    private readonly userService: UserService,
  ) {}
  @Post()
  @Roles("admin")
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  // Move suggestions route BEFORE :id route to avoid conflicts
  @Get('suggestions')
  @Roles("admin", "user")
  async getTopBorrowedBooks(@Query('limit') limit: string = '10') {
    const limitNum = parseInt(limit) || 10;
    return this.booksService.getTopBorrowedBooks(limitNum);
  }

  @Get()
  @Roles("admin","user")
  findAll() {
    return this.booksService.findAll();
  }

  @Get('my-borrowed')
  @UseGuards(JwtAuthGuard)
  async getUserBorrowedBooks(@Req() req) {
    console.log('Request user:', req.user); // Add this to debug
    
    // Extract user ID from the authenticated user
    const userId = req.user._id || req.user.id;
    console.log('Extracted userId:', userId);
    
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    return this.booksService.getUserBorrowedBooks(userId.toString());
  }

  @Get(':id')
  @Roles("admin","user")
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @Roles("admin")
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @Roles("admin")
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':bookId/borrow')
  @Roles("admin", "user")
  async borrowBook(@Param('bookId') bookId: string, @Req() request) {

    // Try both id and _id properties
    const userId = request.user?.id || request.user?._id;
    
    if (!userId) {
      console.error('No user ID found in request.user:', request.user);
      throw new UnauthorizedException('User ID not found in request');
    }

    try {
      // Check if user already has this book in their books array
      const user = await this.userService.findById(userId.toString());
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if the book is already in user's books array
      const hasBook = user.books.some(book => book.bookId.toString() === bookId);
      
      if (hasBook) {
        throw new BadRequestException('You have already borrowed this book');
      }

      const transaction = await this.transactionsService.createTransaction({
        userId: userId.toString(),
        bookId
      });

      await this.userService.addBorrowedBook(
        userId.toString(),
        bookId,
        transaction.token
      );

      await this.booksService.incrementBorrowCount(bookId);

      return {
        message: 'Book borrowed successfully',
        token: transaction.token,
        expiresAt: transaction.expiresAt
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  @Get(':bookId/read')
  @UseGuards(BookTokenGuard) 
  async readBook(@Param('bookId') bookId: string, @Req() request) {
    const transaction = request.transaction;
    return {
      message: 'Access granted to book',
      bookId,
      expiresAt: transaction.expiresAt,
      token: transaction.token
    };
  }

  @Post(':bookId/return')
  @Roles("admin", "user")
  async returnBook(@Param('bookId') bookId: string, @Req() request) {
    const userId = request.user?.id || request.user?._id;
    const token = request.headers['book-token'] || request.body.token;
    
    if (!userId || !token) {
      throw new UnauthorizedException('User ID and token are required');
    }

    try {
      // Deactivate transaction
      await this.transactionsService.deactivateTransaction(token);
      
      // Remove borrowed book from user's books array
      await this.userService.removeBorrowedBook(userId.toString(), token);

      return {
        message: 'Book returned successfully'
      };
    } catch (error) {
      console.error('Error returning book:', error);
      throw error;
    }
  }
  
}
