import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, UnauthorizedException } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BookTokenGuard } from '../common/guards/book-token.guard';
import { TransactionsService } from '../transactions/transactions.service';

@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly transactionsService: TransactionsService
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
    // Debug: Log the request.user object
    console.log('Request user:', request.user);
    console.log('User ID (id):', request.user?.id);
    console.log('User ID (_id):', request.user?._id);
    console.log('Book ID:', bookId);

    // Try both id and _id properties
    const userId = request.user?.id || request.user?._id;
    
    if (!userId) {
      console.error('No user ID found in request.user:', request.user);
      throw new UnauthorizedException('User ID not found in request');
    }

    try {
      const transaction = await this.transactionsService.createTransaction({
        userId: userId.toString(), // Ensure it's a string
        bookId
      });

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
  @UseGuards(BookTokenGuard) // Remove JwtAuthGuard since it's already applied globally
  async readBook(@Param('bookId') bookId: string, @Req() request) {
    const transaction = request.transaction;
    return {
      message: 'Access granted to book',
      bookId,
      expiresAt: transaction.expiresAt,
      token: transaction.token
    };
  }
}
