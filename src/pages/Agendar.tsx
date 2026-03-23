import { useState, useMemo } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Agendar() {
  const {
    addTransaction,
    removeTransaction,
    updateTransaction,
    transactions,
    expenseCategories,
    isSyncing,
  } = useMainStore()

  const [description, setDescription] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [category, setCategory] = useState('')

  const scheduledTasks = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'Pendente')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !date || !category) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      })
      return
    }

    try {
      await addTransaction({
        id: Math.random().toString(36).substring(2, 9),
        description,
        date: date.toISOString().split('T')[0],
        category,
        amount: 0,
        type: 'Despesa',
        status: 'Pendente',
        classification: 'Despesa Operacional',
      })
      toast({ title: 'Agendado com sucesso', description: 'A tarefa financeira foi salva.' })
      setDescription('')
      setDate(undefined)
      setCategory('')
    } catch (error) {
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível salvar.',
        variant: 'destructive',
      })
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await updateTransaction(id, { status: 'Pago' })
      toast({ title: 'Concluído', description: 'Tarefa marcada como concluída.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao atualizar.', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeTransaction(id)
      toast({ title: 'Removido', description: 'A tarefa foi excluída.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-accent">
            Agendar Tarefa Financeira
          </h1>
          <p className="text-muted-foreground mt-1">
            Programe e gerencie seus compromissos financeiros futuros.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Nova Tarefa</CardTitle>
            <CardDescription>Preencha os detalhes para agendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Input
                  id="desc"
                  placeholder="Ex: Pagar fornecedor de TI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSyncing}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                      )}
                      disabled={isSyncing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSyncing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSyncing}>
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CalendarIcon className="w-4 h-4 mr-2" />
                )}
                Agendar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle>Tarefas Agendadas</CardTitle>
            <CardDescription>Lista de compromissos pendentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <CheckCircle2 className="w-10 h-10 mb-3 opacity-20" />
                <p>Nenhuma tarefa pendente agendada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-lg shadow-sm gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{task.description}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {new Date(task.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span className="bg-muted px-2 py-0.5 rounded-full font-medium">
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(task.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
