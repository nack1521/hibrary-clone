import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await this.transactionModel
      .find({ userId })
      .populate('bookId', 'book_name book_author book_cover_image_url')
      .sort({ startTime: -1 });
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await this.transactionModel
      .find()
      .populate('userId', 'name surname email')
      .populate('bookId', 'book_name book_author book_cover_image_url')
      .sort({ startTime: -1 });
  }

  async getUserActiveTransactions(userId: string): Promise<Transaction[]> {
    return await this.transactionModel
      .find({
        userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      })
      .populate('bookId', 'name author coverImage')
      .sort({ startTime: -1 });
  }

  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { userId, bookId } = createTransactionDto;
    
    // Debug logs
    console.log('Creating transaction with:', { userId, bookId });
    
    // Validate that IDs are provided
    if (!userId || !bookId) {
      throw new BadRequestException('UserId and BookId are required');
    }

    // Convert to ObjectId if they're strings
    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    const bookObjectId = Types.ObjectId.isValid(bookId) ? new Types.ObjectId(bookId) : bookId;

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
    //const expiresAt = new Date(Date.now() + (2 * 60 * 1000));

    const transaction = new this.transactionModel({
      userId: userObjectId,
      bookId: bookObjectId,
      token,
      expiresAt,
    });

    return await transaction.save();
  }

  async validateToken(token: string, bookId: string, userId: string): Promise<boolean> {
    const transaction = await this.transactionModel.findOne({
      token,
      bookId,
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    return !!transaction;
  }

  async deactivateTransaction(token: string): Promise<void> {
    await this.transactionModel.updateOne(
      { token },
      { isActive: false }
    );
  }
}