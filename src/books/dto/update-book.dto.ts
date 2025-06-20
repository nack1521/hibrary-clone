export class UpdateBookDto {
    book_name?: string;
    book_author?: string;
    book_description?: string;
    book_cover_image_url?: string;
    book_reader_url?: string;
    book_borrow_count?: number;
    categories?: string[]; // Assuming _id is a string representation of ObjectId
}
