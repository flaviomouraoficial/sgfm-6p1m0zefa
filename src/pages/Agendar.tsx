import { useState, useMemo, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Database,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import logoUrl from '../assets/logo-21a08.jpg'
import { TimeSlot } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'

export default function Agendar() {
  const {
    timeSlots,
    bookTimeSlot,
    isPublicDataLoaded,
    isSyncing,
    publicDataError,
    syncPublicData,
    systemSettings,
    servicos,
    profissionais,
  } = useMainStore()

  useEffect(() => {
    if (!isPublicDataLoaded) {
      syncPublicData()
    }
  }, [isPublicDataLoaded, syncPublicData])

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [servicoId, setServicoId] = useState<string>('')
  const [profissionalId, setProfissionalId] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const hasServices = servicos && servicos.length > 0
  const hasProfessionals = profissionais && profissionais.length > 0
  const isFormValid = hasServices && hasProfessionals

  useEffect(() => {
    if (hasServices && (!servicoId || servicoId === 'empty')) {
      setServicoId(servicos[0].id)
    } else if (!hasServices) {
      setServicoId('empty')
    }
    if (hasProfessionals && (!profissionalId || profissionalId === 'empty')) {
      setProfissionalId(profissionais[0].id)
    } else if (!hasProfessionals) {
      setProfissionalId('empty')
    }
  }, [servicos, profissionais, servicoId, profissionalId, hasServices, hasProfessionals])

  const availableSlots = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return timeSlots.filter((t) => !t.isBooked && new Date(t.date + 'T00:00:00') >= now)
  }, [timeSlots])

  const activeDates = useMemo(() => {
    return availableSlots.map((s) => new Date(s.date + 'T00:00:00'))
  }, [availableSlots])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return availableSlots
      .filter((s) => s.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [availableSlots, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !selectedSlot ||
      !name ||
      !email ||
      !phone ||
      !servicoId ||
      !profissionalId ||
      servicoId === 'empty' ||
      profissionalId === 'empty'
    )
      return

    setIsSubmitting(true)
    try {
      await bookTimeSlot(
        selectedSlot.id,
        name,
        email,
        phone,
        description,
        servicoId,
        profissionalId,
      )
      setIsSuccess(true)
      toast({ title: 'Sucesso', description: 'Sessão agendada com sucesso e salva na nuvem!' })
    } catch (err: any) {
      toast({
        title: 'Erro de Conexão',
        description:
          err.message || 'Não foi possível salvar o agendamento. Verifique a configuração.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isPublicDataLoaded || (isSyncing && !publicDataError)) {
    return (
      <div className="min-h-[100dvh] bg-muted/10 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
        <Card className="w-full max-w-5xl shadow-2xl border-border/50 flex flex-col md:flex-row rounded-2xl overflow-hidden min-h-[600px]">
          <div className="md:w-[380px] bg-accent p-6 sm:p-8 flex flex-col shrink-0 space-y-6">
            <Skeleton className="w-24 h-24 rounded-[1.25rem] bg-white/20" />
            <Skeleton className="h-8 w-3/4 bg-white/20" />
            <Skeleton className="h-20 w-full bg-white/20" />
          </div>
          <div className="flex-1 p-6 sm:p-8 md:p-10 bg-card space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-[300px] space-y-4">
                <Skeleton className="w-full h-[300px] rounded-xl" />
              </div>
              <div className="flex-1 space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (publicDataError) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-border/50">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Serviço Indisponível</h2>
            <p className="text-muted-foreground leading-relaxed">{publicDataError}</p>
            <Button
              onClick={() => syncPublicData()}
              variant="default"
              className="mt-4 w-full sm:w-auto"
            >
              <Loader2
                className={cn('w-4 h-4 mr-2', { 'animate-spin': isSyncing, hidden: !isSyncing })}
              />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-muted/10 p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-border/50">
          <CardContent className="pt-10 pb-10 space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground">
              Sua sessão com{' '}
              {profissionais?.find((p) => p.id === profissionalId)?.nome ||
                systemSettings?.companyName ||
                'Nossa Equipe'}{' '}
              foi agendada para o dia{' '}
              <strong>
                {selectedSlot &&
                  format(new Date(selectedSlot.date + 'T00:00:00'), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
              </strong>{' '}
              às <strong>{selectedSlot?.time}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Enviamos os detalhes para o seu e-mail: <br />{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 w-full sm:w-auto"
            >
              Fazer novo agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-muted/10 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <Card className="w-full max-w-5xl shadow-2xl border-border/50 flex flex-col md:flex-row rounded-2xl overflow-hidden min-h-[600px]">
        <div className="md:w-[380px] bg-accent text-white p-6 sm:p-8 flex flex-col shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl sm:rounded-[1.25rem] p-3 mb-6 flex items-center justify-center shadow-lg">
            <img
              src={systemSettings?.logo || logoUrl}
              alt="Logo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 tracking-tight">
            {systemSettings?.companyName || 'Nossa Empresa'}
          </h2>
          <p className="text-white/85 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed font-medium">
            Selecione uma data e horário disponíveis para agendar sua sessão com nossos
            profissionais.
          </p>
          <div className="mt-auto hidden md:inline-flex items-center text-xs sm:text-sm font-semibold text-white bg-white/10 px-4 py-2.5 rounded-full w-max border border-white/10">
            <Clock className="w-4 h-4 mr-2" /> Duração Padrão:{' '}
            {systemSettings?.defaultDuration || 60} min
          </div>
        </div>

        <div className="flex-1 p-6 sm:p-8 md:p-10 bg-card relative">
          {!hasServices || !hasProfessionals ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-muted/5 rounded-xl border-2 border-dashed border-border/80">
              <Database className="w-12 h-12 mb-4 text-amber-500 opacity-80" />
              <h3 className="text-xl font-bold text-foreground">Nenhum Dado Encontrado</h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
                A conexão com o banco de dados foi estabelecida com sucesso, mas não há
                profissionais ou serviços cadastrados na plataforma. Por favor, acesse o painel
                administrativo e adicione os registros para habilitar o agendamento público.
              </p>
            </div>
          ) : !selectedSlot ? (
            <div className="space-y-6 h-full flex flex-col">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground border-b pb-4">
                Selecione Data e Horário
              </h3>
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">
                <div className="w-full md:w-auto flex justify-center md:justify-start shrink-0">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{ active: activeDates }}
                    modifiersClassNames={{ active: 'font-bold text-primary bg-primary/10' }}
                    disabled={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const startOfToday = new Date()
                      startOfToday.setHours(0, 0, 0, 0)
                      return !availableSlots.some((s) => s.date === dateStr) || date < startOfToday
                    }}
                    className="rounded-xl border shadow-sm p-3 h-max w-full md:w-auto"
                  />
                </div>
                <div className="flex-1 md:border-l md:pl-8 flex flex-col">
                  {selectedDate ? (
                    slotsForSelectedDate.length > 0 ? (
                      <div className="space-y-4 animate-in fade-in flex flex-col">
                        <p className="text-base sm:text-lg font-medium text-foreground capitalize">
                          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-1">
                          {slotsForSelectedDate.map((slot) => (
                            <Button
                              key={slot.id}
                              variant="outline"
                              className="w-full justify-center border-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground text-primary h-12 transition-all text-sm sm:text-base font-semibold rounded-lg"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 animate-in fade-in py-10 md:py-0">
                        <CheckCircle2 className="w-12 h-12 mb-4" strokeWidth={1.5} />
                        <p className="text-center">Nenhum horário livre nesta data.</p>
                      </div>
                    )
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 py-10 md:py-0">
                      <CalendarIcon className="w-12 h-12 mb-4" strokeWidth={1.5} />
                      <p className="text-center max-w-[200px]">
                        Selecione um dia disponível no calendário para continuar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <div className="flex items-center gap-2 border-b pb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedSlot(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Confirmar Agendamento
                </h3>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Horário Selecionado
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground capitalize">
                    {format(new Date(selectedSlot.date + 'T00:00:00'), "EEEE, dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="text-xl font-bold text-primary bg-background px-4 py-2 rounded-lg shadow-sm border border-primary/10 text-center">
                  {selectedSlot.time}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Nome Completo *</Label>
                  <Input
                    required
                    className="h-11"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">E-mail *</Label>
                    <Input
                      required
                      type="email"
                      className="h-11"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Telefone / WhatsApp *</Label>
                    <Input
                      required
                      type="tel"
                      className="h-11"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Serviço Desejado *</Label>
                    <Select required value={servicoId} onValueChange={setServicoId}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {servicos.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nome} {s.duracao_minutos ? `(${s.duracao_minutos} min)` : ''}{' '}
                            {s.preco ? `- ${formatCurrency(s.preco)}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Profissional *</Label>
                    <Select required value={profissionalId} onValueChange={setProfissionalId}>
                      <SelectTrigger className="h-11 bg-background">
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {profissionais.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} {p.especialidade ? `- ${p.especialidade}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label className="text-sm font-semibold">Observações / Foco (Opcional)</Label>
                  <Textarea
                    placeholder="Descreva o foco principal ou dúvidas..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none h-11 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm sm:text-base font-semibold shadow-md mt-auto"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Confirmar Agendamento
                </Button>
              </form>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
