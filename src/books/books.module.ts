import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import { Book, BookSchema } from './schemas/book.schema';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    UserModule,
    CategoriesModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
