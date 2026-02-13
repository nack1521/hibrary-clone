import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateBookDto {
        @IsOptional()
        @IsString()
        book_name?: string;
    
        @IsOptional()
        @IsString()
        book_author?: string;
    
        @IsOptional()
        @IsString()
        book_description?: string;
    
        @IsOptional()
        @IsString()
        book_cover_image_url?: string;
    
        @IsOptional()
        @IsString()
        book_reader_url?: string;
    
        @IsOptional()
        @IsNumber()
        book_borrow_count?: number;
    
        @IsOptional()
        categories?: string[]; // Assuming _id is a string representation of ObjectId
    
        @IsOptional()
        @IsBoolean()
        isAvailable?: boolean = true;
}
