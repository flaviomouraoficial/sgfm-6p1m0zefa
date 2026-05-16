import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import type { Book } from '@/lib/types'
import { getBookCoverUrl } from '@/services/biblioteca'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: Book | null
}

export function BookDetailsDialog({ open, onOpenChange, book }: Props) {
  if (!book) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Detalhes do Livro
            {book.favorito && <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="flex justify-center md:justify-start">
            <img
              src={getBookCoverUrl(book)}
              alt={book.titulo}
              className="w-full max-w-[200px] h-auto aspect-[2/3] object-cover rounded-lg shadow-md border"
            />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">{book.titulo}</h2>
              <p className="text-lg text-muted-foreground">{book.autor}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {book.categoria}
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
                {book.status_leitura}
              </span>
            </div>
            {book.palavras_chave && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Palavras-chave</h4>
                <p className="text-sm text-muted-foreground">{book.palavras_chave}</p>
              </div>
            )}
            {book.descricao && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Descrição</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {book.descricao}
                </p>
              </div>
            )}
            {book.observacoes && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Observações / Aprendizados
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                  {book.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
