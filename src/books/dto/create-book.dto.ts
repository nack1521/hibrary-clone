export class CreateBookDto {
    book_name: string;
    book_author: string;
    book_description: string;
    book_cover_image_url: string;
    book_reader_url: string;
    book_borrow_count?: number; // Optional, defaults to 0
    categories: string[]; // Assuming _id is a string representation of ObjectId
}
