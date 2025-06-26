import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  cate_name: string;

  @IsOptional()
  @IsString()
  cate_cover_url?: string;
}