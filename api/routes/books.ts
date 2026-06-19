import { Router } from 'express';
import { bookService } from '../services/BookService.ts';

const router = Router();

router.get('/', (req, res) => {
  const { search, category } = req.query;
  const books = bookService.getBooks(
    search as string | undefined,
    category as string | undefined
  );
  res.json(books);
});

router.get('/categories', (_req, res) => {
  const categories = bookService.getCategories();
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const book = bookService.getBook(req.params.id);
  if (!book) {
    res.status(404).json({ error: '作品不存在' });
    return;
  }
  res.json(book);
});

export default router;
