import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(userId: string, bookId: string): Promise<UserDocument | null> {
    return await this.userModel.findById(userId, bookId).exec();
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
  async removeBorrowedBook(userId: string, token: string) {
    try {
      console.log('Removing borrowed book for user:', userId, 'token:', token);
      
      const result = await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId) }, // Ensure userId is properly converted
        { 
          $pull: { 
            books: { token: token } 
          } 
        }
      );
      
      console.log('Remove book result:', result);
      return result;
    } catch (error) {
      console.error('Error removing borrowed book:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    try {
      console.log('Updating user with ID:', userId);
      console.log('Update data:', updateData);
      
      const result = await this.userModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).exec();
      
      console.log('Update result:', result);
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(userId: string): Promise<User | null> {
    try {
      console.log('Deleting user with ID:', userId);
      
      const result = await this.userModel.findByIdAndDelete(userId).exec();
      
      console.log('Delete result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting user:', error);
      return null;
    }
  }

  async softDeleteUser(userId: string, deletedBy?: string): Promise<User | null> {
    try {
      console.log('Soft deleting user with ID:', userId);
      
      const result = await this.userModel.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        { 
          isDeleted: true,
          deletedAt: new Date(),
        },
        { new: true }
      ).exec();
      
      if (!result) {
        throw new NotFoundException('User not found or already deleted');
      }
      
      console.log('Soft delete result:', result);
      return result;
    } catch (error) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  }

  // Restore soft deleted user
  async restoreUser(userId: string): Promise<User | null> {
    try {
      console.log('Restoring user with ID:', userId);
      
      const result = await this.userModel.findOneAndUpdate(
        { _id: userId, isDeleted: true },
        { 
          isDeleted: false,
          deletedAt: null
        },
        { new: true }
      ).exec();
      
      if (!result) {
        throw new NotFoundException('User not found or not deleted');
      }
      
      console.log('Restore result:', result);
      return result;
    } catch (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  }

  // Get all active users (not deleted)
  async getAllUsers(): Promise<User[]> {
    return this.userModel.find({ isDeleted: false }).exec();
  }

  // Get all deleted users
  async getDeletedUsers(): Promise<User[]> {
    return this.userModel.find({ isDeleted: true }).exec();
  }

  // Get all users including deleted ones
  async getAllUsersIncludingDeleted(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  // Check if user exists (including deleted)
  async userExists(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return !!user;
  }

  // Check if user is deleted
  async isUserDeleted(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();
    return user ? user.isDeleted : false;
  }
}
