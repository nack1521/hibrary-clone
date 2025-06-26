import { IsOptional, IsString } from 'class-validator';

export class SearchBookDto {
  @IsOptional()
  @IsString()
  book_name?: string;

  @IsOptional()
  @IsString()
  book_author?: string;

  @IsOptional()
  @IsString()
  categories?: string[];

  @IsOptional()
  @IsString()
  query?: string;
}