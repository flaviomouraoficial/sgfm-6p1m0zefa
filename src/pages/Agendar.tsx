import { useState, useMemo } from 'react'
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
import { Calendar as CalendarIcon, Clock, CheckCircle2, RefreshCw } from 'lucide-react'

export default function Agendar() {
  const { timeSlots, bookTimeSlot, syncData, isSyncing, isInitialLoad } = useMainStore()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [successSlot, setSuccessSlot] = useState<TimeSlot | null>(null)

  const [menteeName, setMenteeName] = useState('')
  const [menteeEmail, setMenteeEmail] = useState('')
  const [menteeCompany, setMenteeCompany] = useState('')

  const todayStr = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }, [])

  const availableSlots = useMemo(() => {
    return timeSlots.filter((t) => !t.isBooked && t.date >= todayStr)
  }, [timeSlots, todayStr])

  const availableDates = useMemo(() => {
    return availableSlots.map((t) => {
      const [year, month, day] = t.date.split('-').map(Number)
      return new Date(year, month - 1, day)
    })
  }, [availableSlots])

  const displayedSlots = useMemo(() => {
    let slots = availableSlots

    if (selectedDate) {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      slots = slots.filter((t) => t.date === dateStr)
    }

    return slots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }, [availableSlots, selectedDate])

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSlot && menteeName && menteeEmail && menteeCompany) {
      // Prevenção de Double Booking lendo direto do localStorage atualizado
      let isAvailable = false
      try {
        const saved = localStorage.getItem('sgfm_main_state')
        if (saved) {
          const parsed = JSON.parse(saved)
          const currentSlot = parsed.timeSlots?.find((t: TimeSlot) => t.id === selectedSlot.id)
          if (currentSlot && !currentSlot.isBooked) {
            isAvailable = true
          }
        }
      } catch (err) {
        const currentSlotState = timeSlots.find((t) => t.id === selectedSlot.id)
        if (currentSlotState && !currentSlotState.isBooked) {
          isAvailable = true
        }
      }

      if (!isAvailable) {
        toast({
          title: 'Horário Indisponível',
          description:
            'Desculpe, os dados foram atualizados e este horário não está mais disponível. Pode ter sido reservado por outra pessoa.',
          variant: 'destructive',
        })
        setSelectedSlot(null)
        syncData()
        return
      }

      bookTimeSlot(selectedSlot.id, menteeName, menteeEmail, menteeCompany)
      setSuccessSlot(selectedSlot)
      setSelectedSlot(null)
    } else {
      toast({
        title: 'Erro de Preenchimento',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
    }
  }

  const handleCloseSuccess = () => {
    setSuccessSlot(null)
    setMenteeName('')
    setMenteeEmail('')
    setMenteeCompany('')
  }

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8 flex justify-center animate-fade-in relative">
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
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 md:px-8 flex justify-center animate-fade-in relative">
      {isSyncing && !isInitialLoad && (
        <div className="fixed bottom-4 right-4 sm:bottom-auto sm:top-4 bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-full shadow-lg flex items-center text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-4 z-50">
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
          Atualizando agenda...
        </div>
      )}

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
                  : 'Todos os horários disponíveis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {displayedSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p>
                    Nenhum horário disponível para {selectedDate ? 'este dia' : 'os próximos dias'}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {displayedSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center justify-center border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors group"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {!selectedDate && (
                        <span className="text-[10px] font-medium opacity-80 mb-0.5">
                          {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      )}
                      <span className="font-bold text-lg">{slot.time}</span>
                      {slot.description && (
                        <span className="text-[10px] mt-1 font-medium opacity-80 text-center px-1 line-clamp-1">
                          {slot.description}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100 mt-1">
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

      {/* Modal de Confirmação de Reserva */}
      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Preencha seus dados para reservar a sessão no dia{' '}
              <strong className="text-foreground">
                {selectedSlot &&
                  new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </strong>{' '}
              às <strong className="text-foreground">{selectedSlot?.time}</strong>.
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

      {/* Modal de Sucesso */}
      <Dialog open={!!successSlot} onOpenChange={(open) => !open && handleCloseSuccess()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl">Agendamento Realizado com Sucesso!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Sua mentoria foi confirmada para o dia{' '}
              <strong className="text-foreground">
                {successSlot &&
                  new Date(successSlot.date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </strong>{' '}
              às <strong className="text-foreground">{successSlot?.time}</strong>.
            </DialogDescription>
            <p className="text-sm text-muted-foreground">
              O mentor foi notificado sobre a sua reserva.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-center">
            <Button onClick={handleCloseSuccess} className="w-full sm:w-auto">
              Fechar e Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
