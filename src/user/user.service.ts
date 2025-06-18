import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema'; // Adjust the import path as necessary
import { Model } from 'mongoose';
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
}
