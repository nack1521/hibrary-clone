import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../../transactions/schemas/transaction.schema';

@Injectable()
export class BookTokenGuard implements CanActivate {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const token = request.headers['book-token'] || request.query.token;
    const bookId = request.params.bookId || request.body.bookId;
    const userId = request.user?.id;

    if (!token) {
      throw new UnauthorizedException('Book token is required');
    }

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Convert string IDs to ObjectIds for proper MongoDB querying
      const userObjectId = new Types.ObjectId(userId);
      const bookObjectId = new Types.ObjectId(bookId);

      // The main query with ObjectIds
      const query = {
        token,
        bookId: bookObjectId,
        userId: userObjectId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      };

      const transaction = await this.transactionModel.findOne(query);

      if (!transaction) {
        throw new UnauthorizedException('Invalid or expired book token');
      }

      request.transaction = transaction;
      return true;
    } catch (error) {
      throw error;
    }
  }
}