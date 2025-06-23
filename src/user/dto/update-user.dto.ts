import { PartialType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class BorrowedBookDto {
  token: string;
  bookId: Types.ObjectId;
  dateCreated: Date;
}

export class UpdateUserDto extends PartialType(RegisterUserDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BorrowedBookDto)
  books?: BorrowedBookDto[];
}