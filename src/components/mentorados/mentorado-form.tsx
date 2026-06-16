import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  contractValue: z.number().min(0, 'Valor não pode ser negativo').optional(),
  totalSessions: z.number().min(0, 'Total não pode ser negativo').optional(),
})

type FormData = z.infer<typeof schema>

interface MentoradoFormProps {
  mentee?: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MentoradoForm({ mentee, isOpen, onClose, onSuccess }: MentoradoFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      status: 'Ativo',
      contractValue: 0,
      totalSessions: 0,
    },
  })

  useEffect(() => {
    if (isOpen) {
      setFieldErrors({})
      if (mentee) {
        reset({
          name: mentee.name || '',
          email: mentee.email || '',
          phone: mentee.phone || '',
          company: mentee.company || '',
          status: mentee.status || 'Ativo',
          contractValue: mentee.contractValue || 0,
          totalSessions: mentee.totalSessions || 0,
        })
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'Ativo',
          contractValue: 0,
          totalSessions: 0,
        })
      }
    }
  }, [mentee, isOpen, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setFieldErrors({})
    try {
      if (mentee?.id) {
        await pb.collection('v1_mentees').update(mentee.id, data)
        toast({ title: 'Sucesso', description: 'Mentorado atualizado com sucesso.' })
      } else {
        await pb.collection('v1_mentees').create(data)
        toast({ title: 'Sucesso', description: 'Mentorado criado com sucesso.' })
      }
      onSuccess()
      onClose()
    } catch (err) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: getErrorMessage(err) })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mentee ? 'Editar Mentorado' : 'Novo Mentorado'}</DialogTitle>
          <DialogDescription>
            {mentee
              ? 'Atualize os dados do mentorado abaixo.'
              : 'Preencha os dados para adicionar um novo mentorado.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register('name')} placeholder="Nome completo" />
            {(errors.name || fieldErrors.name) && (
              <p className="text-sm text-destructive">{errors.name?.message || fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
              />
              {(errors.email || fieldErrors.email) && (
                <p className="text-sm text-destructive">
                  {errors.email?.message || fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register('phone')} placeholder="Telefone / WhatsApp" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa (Opcional)</Label>
            <Input id="company" {...register('company')} placeholder="Nome da empresa" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={watch('status')} onValueChange={(val) => setValue('status', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalSessions">Total de Sessões</Label>
              <Input
                id="totalSessions"
                type="number"
                min="0"
                {...register('totalSessions', {
                  setValueAs: (v) => (v === '' ? 0 : parseInt(v, 10)),
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractValue">Valor do Contrato (R$)</Label>
            <Input
              id="contractValue"
              type="number"
              step="0.01"
              min="0"
              {...register('contractValue', { setValueAs: (v) => (v === '' ? 0 : parseFloat(v)) })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
