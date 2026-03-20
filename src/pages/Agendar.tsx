import { useState, useMemo, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { TimeSlot } from '@/lib/types'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react'

export default function Agendar() {
  const { timeSlots, bookTimeSlot } = useMainStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [menteeName, setMenteeName] = useState('')
  const [menteeEmail, setMenteeEmail] = useState('')
  const [menteeCompany, setMenteeCompany] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate real-time fetch to ensure UI properly reflects synced state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const availableSlots = useMemo(() => timeSlots.filter((t) => !t.isBooked), [timeSlots])

  // Extract dates that have available slots
  const availableDates = useMemo(() => {
    return availableSlots.map((t) => {
      const [year, month, day] = t.date.split('-').map(Number)
      return new Date(year, month - 1, day)
    })
  }, [availableSlots])

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : ''

  const daySlots = useMemo(() => {
    return availableSlots
      .filter((t) => t.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [availableSlots, dateStr])

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSlot && menteeName && menteeEmail && menteeCompany) {
      bookTimeSlot(selectedSlot.id, menteeName, menteeEmail, menteeCompany)
      setSuccess(true)
      setSelectedSlot(null)
      toast({ title: 'Sessão Reservada!', description: 'Sua mentoria foi agendada com sucesso.' })
    } else {
      toast({
        title: 'Erro de Preenchimento',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8 flex justify-center animate-fade-in">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2 flex flex-col items-center">
            <Skeleton className="h-10 w-64 md:w-96" />
            <Skeleton className="h-5 w-48 md:w-80 mt-2" />
          </div>

          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            <Card className="w-full max-w-[320px] mx-auto shadow-sm">
              <CardContent className="p-3">
                <Skeleton className="w-full h-[320px]" />
              </CardContent>
            </Card>

            <Card className="shadow-sm min-h-[380px]">
              <CardHeader className="pb-4 border-b border-border/50">
                <Skeleton className="h-7 w-48" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg animate-in fade-in zoom-in duration-300">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Reserva Confirmada!</CardTitle>
            <CardDescription className="text-base">
              Olá, <strong>{menteeName}</strong>. Sua mentoria foi agendada e o mentor foi
              notificado.
            </CardDescription>
            <Button
              className="mt-4"
              onClick={() => {
                setSuccess(false)
                setMenteeName('')
                setMenteeEmail('')
                setMenteeCompany('')
              }}
            >
              Agendar Nova Sessão
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8 flex justify-center animate-fade-in">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Agendamento de Mentoria
          </h1>
          <p className="text-muted-foreground">
            Selecione uma data e horário para reservar sua sessão com Flávio Moura.
          </p>
        </div>

        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <Card className="w-full max-w-[320px] mx-auto shadow-sm">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ available: availableDates }}
                modifiersClassNames={{
                  available: 'bg-primary/10 text-primary font-bold rounded-md',
                }}
                className="w-full pointer-events-auto"
              />
              <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
                <div className="w-3 h-3 bg-primary/10 rounded mr-2"></div>
                Dias com horários disponíveis
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm min-h-[380px]">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                {selectedDate
                  ? selectedDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Selecione uma data'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {daySlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p>Nenhum horário disponível para este dia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {daySlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className="h-14 flex flex-col items-center justify-center border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors group"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span className="font-bold text-lg">{slot.time}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100">
                        Selecionar
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Preencha seus dados para reservar a sessão no dia{' '}
              <strong>
                {selectedSlot &&
                  new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </strong>{' '}
              às <strong>{selectedSlot?.time}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome Completo *</Label>
              <Input
                id="name"
                required
                placeholder="Ex: João da Silva"
                value={menteeName}
                onChange={(e) => setMenteeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Seu E-mail *</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="joao@email.com"
                value={menteeEmail}
                onChange={(e) => setMenteeEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Sua Empresa *</Label>
              <Input
                id="company"
                required
                placeholder="Ex: Empresa Ltda"
                value={menteeCompany}
                onChange={(e) => setMenteeCompany(e.target.value)}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSelectedSlot(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!menteeName || !menteeEmail || !menteeCompany}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Reservar Horário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
