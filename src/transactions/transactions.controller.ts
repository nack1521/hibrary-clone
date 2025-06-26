import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Get current user's transactions
  @Get('my-transactions')
  async getMyTransactions(@Req() request) {
    const userId = request.user.id;
    return await this.transactionsService.getUserTransactions(userId);
  }

  // Get all transactions (admin only)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllTransactions() {
    return await this.transactionsService.getAllTransactions();
  }

  // Get transactions by specific user ID (admin only)
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getTransactionsByUserId(@Param('userId') userId: string) {
    return await this.transactionsService.getUserTransactions(userId);
  }

  // Get active transactions for current user
  @Get('active')
  async getActiveTransactions(@Req() request) {
    const userId = request.user.id;
    return await this.transactionsService.getUserActiveTransactions(userId);
  }


}
