import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema'; // Adjust the import path as necessary
import { Model, Types } from 'mongoose';
import { RegisterUserDto } from './dto/register-user.dto'; // Adjust the import path as necessary


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(registerUserDto: RegisterUserDto): Promise<User> {
    const newUser = new this.userModel(registerUserDto);
    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return await this.userModel.findById(userId).exec();
  }

  // Add this method to add a borrowed book to user's books array
  async addBorrowedBook(userId: string, bookId: string, token: string): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          books: {
            token,
            bookId: new Types.ObjectId(bookId),
            dateCreated: new Date()
          }
        }
      },
      { new: true }
    ).exec();
  }

  // Add this method to remove a borrowed book from user's books array
  async removeBorrowedBook(userId: string, token: string): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(
      userId,
      {
        $pull: {
          books: { token }
        }
      },
      { new: true }
    ).exec();
  }
}
