import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBook, updateBook } from '@/services/biblioteca'
import type { Book } from '@/lib/types'

const schema = z.object({
  titulo: z.string().min(1, 'Obrigatório'),
  autor: z.string().min(1, 'Obrigatório'),
  categoria: z.enum(['Ficção', 'Biografia', 'Autodesenvolvimento', 'Técnico', 'Outras']),
  status_leitura: z.enum(['Não lido', 'Lendo', 'Lido']),
  palavras_chave: z.string().optional(),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  favorito: z.boolean().default(false),
  capa_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
  onSuccess: () => void
}

export function BookFormDialog({ open, onOpenChange, book, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status_leitura: 'Não lido', favorito: false, categoria: 'Ficção' },
  })

  useEffect(() => {
    if (open) {
      if (book) {
        reset({
          titulo: book.titulo,
          autor: book.autor,
          categoria: book.categoria,
          status_leitura: book.status_leitura,
          palavras_chave: book.palavras_chave || '',
          descricao: book.descricao || '',
          observacoes: book.observacoes || '',
          favorito: book.favorito,
          capa_url: book.capa_url || '',
        })
      } else {
        reset({
          status_leitura: 'Não lido',
          favorito: false,
          categoria: 'Ficção',
          titulo: '',
          autor: '',
          palavras_chave: '',
          descricao: '',
          observacoes: '',
          capa_url: '',
        })
      }
      setFile(null)
    }
  }, [open, book, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('titulo', values.titulo)
      formData.append('autor', values.autor)
      formData.append('categoria', values.categoria)
      formData.append('status_leitura', values.status_leitura)
      if (values.palavras_chave) formData.append('palavras_chave', values.palavras_chave)
      if (values.descricao) formData.append('descricao', values.descricao)
      if (values.observacoes) formData.append('observacoes', values.observacoes)
      formData.append('favorito', values.favorito ? 'true' : 'false')
      formData.append('capa_url', values.capa_url || '')
      if (file) formData.append('capa_file', file)

      if (book) {
        await updateBook(book.id, formData)
        toast.success('Livro atualizado com sucesso!')
      } else {
        await createBook(formData)
        toast.success('Livro cadastrado com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao salvar livro. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? 'Editar Livro' : 'Novo Livro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input {...register('titulo')} />
              {errors.titulo && (
                <span className="text-xs text-red-500">{errors.titulo.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Autor *</Label>
              <Input {...register('autor')} />
              {errors.autor && <span className="text-xs text-red-500">{errors.autor.message}</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ficção">Ficção</SelectItem>
                      <SelectItem value="Biografia">Biografia</SelectItem>
                      <SelectItem value="Autodesenvolvimento">Autodesenvolvimento</SelectItem>
                      <SelectItem value="Técnico">Técnico</SelectItem>
                      <SelectItem value="Outras">Outras</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoria && (
                <span className="text-xs text-red-500">{errors.categoria.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Status de Leitura *</Label>
              <Controller
                name="status_leitura"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não lido">Não lido</SelectItem>
                      <SelectItem value="Lendo">Lendo</SelectItem>
                      <SelectItem value="Lido">Lido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status_leitura && (
                <span className="text-xs text-red-500">{errors.status_leitura.message}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Palavras-chave (separadas por vírgula)</Label>
            <Input {...register('palavras_chave')} placeholder="Ex: gestão, liderança, tech" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea {...register('descricao')} className="h-24" />
            </div>
            <div className="space-y-2">
              <Label>Observações / Aprendizados</Label>
              <Textarea {...register('observacoes')} className="h-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Capa (URL)</Label>
              <Input {...register('capa_url')} placeholder="https://..." />
              {errors.capa_url && (
                <span className="text-xs text-red-500">{errors.capa_url.message}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Capa (Arquivo - Sobrescreve a URL)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 py-2">
            <Controller
              name="favorito"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label>Marcar como Favorito/Destaque</Label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
