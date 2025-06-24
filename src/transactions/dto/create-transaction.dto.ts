import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsMongoId()
  bookId: string;
}
