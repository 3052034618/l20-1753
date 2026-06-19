import { bookRepository } from '../repositories/BookRepository.ts';
import type { Book } from '../../shared/types.ts';

export class BookService {
  getBooks(search?: string, category?: string): Book[] {
    return bookRepository.findAll(search, category);
  }

  getBook(id: string): Book | undefined {
    return bookRepository.findById(id);
  }

  getCategories(): string[] {
    return bookRepository.getCategories();
  }
}

export const bookService = new BookService();
