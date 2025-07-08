import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  itemlimit?: number = 100;
}