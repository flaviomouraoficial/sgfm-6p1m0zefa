import pb from '@/lib/pocketbase/client'
import type { Book } from '@/lib/types'

export const getBooks = async () => {
  return pb.collection('v1_biblioteca').getFullList<Book>({ sort: '-created' })
}

export const createBook = async (data: FormData) => {
  return pb.collection('v1_biblioteca').create<Book>(data)
}

export const updateBook = async (id: string, data: FormData) => {
  return pb.collection('v1_biblioteca').update<Book>(id, data)
}

export const deleteBook = async (id: string) => {
  return pb.collection('v1_biblioteca').delete(id)
}

export const getBookCoverUrl = (book: Book) => {
  if (book.capa_file) {
    return pb.files.getURL(book, book.capa_file)
  }
  return book.capa_url || 'https://img.usecurling.com/p/200/300?q=book&color=gray'
}
