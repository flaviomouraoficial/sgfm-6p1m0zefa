import React, { useState } from 'react'
import {
  ReuniaoComercialRecord,
  registerFollowUpContact,
  buildFollowUpWhatsAppMessage,
} from '@/services/reunioesComerciais'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  CalendarClock,
  PhoneCall,
  Copy,
  Check,
  AlertCircle,
  Clock,
  MessageCircle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface FollowUpPanelProps {
  followUps: ReuniaoComercialRecord[]
  onRefresh: () => void
  onSelectMeeting?: (meeting: ReuniaoComercialRecord) => void
}

export function FollowUpPanel({ followUps, onRefresh, onSelectMeeting }: FollowUpPanelProps) {
  const { toast } = useToast()
  const todayStr = new Date().toISOString().split('T')[0]

  const [selectedMeeting, setSelectedMeeting] = useState<ReuniaoComercialRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [proximaData, setProximaData] = useState('')
  const [anotacao, setAnotacao] = useState('')
  const [novoResultado, setNovoResultado] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Separar em atrasados e hoje/futuros
  const atrasados = followUps.filter(
    (f) => f.data_proximo_contato && f.data_proximo_contato < todayStr,
  )
  const hoje = followUps.filter((f) => f.data_proximo_contato === todayStr)
  const proximos = followUps.filter(
    (f) => f.data_proximo_contato && f.data_proximo_contato > todayStr,
  )

  const handleOpenContactModal = (item: ReuniaoComercialRecord) => {
    setSelectedMeeting(item)
    // Sugere próximo contato em +3 dias por padrão
    const defaultNext = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setProximaData(defaultNext)
    setAnotacao('')
    setNovoResultado(item.resultado || 'Objeção em aberto')
    setModalOpen(true)
  }

  const handleSaveContact = async () => {
    if (!selectedMeeting) return
    if (!anotacao.trim()) {
      toast({
        title: 'Anotação obrigatória',
        description: 'Descreva brevemente o que foi alinhado no contato.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await registerFollowUpContact(
        selectedMeeting.id,
        proximaData,
        anotacao,
        novoResultado || undefined,
      )

      toast({
        title: 'Contato Registrado',
        description: `Follow-up atualizado com sucesso para ${selectedMeeting.lead_nome}.`,
      })

      setModalOpen(false)
      setSelectedMeeting(null)
      onRefresh()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar contato',
        description: err.message || 'Não foi possível salvar o follow-up.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyWhatsAppMessage = (item: ReuniaoComercialRecord) => {
    const text = buildFollowUpWhatsAppMessage(item)
    navigator.clipboard.writeText(text)
    setCopiedId(item.id)
    toast({
      title: 'Mensagem de WhatsApp copiada!',
      description: 'Texto de follow-up pronto para colar e enviar ao lead.',
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Follow-ups de Reuniões
                {atrasados.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {atrasados.length} atrasado{atrasados.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {hoje.length > 0 && (
                  <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">
                    {hoje.length} para hoje
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Contatos agendados pelo Assistente Comercial com lembrete automático diário.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs shrink-0">
            Atualizar lista
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {followUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-muted-foreground/40" />
            <p>Nenhum follow-up pendente para os próximos dias.</p>
            <p className="text-xs text-muted-foreground/70">
              Ao concluir uma reunião no Assistente com "Data do Próximo Contato", ela aparecerá
              aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bloco de Atrasados */}
            {atrasados.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Atrasados ({atrasados.length})
                </div>
                <div className="grid gap-2">
                  {atrasados.map((item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      isAtrasado
                      copiedId={copiedId}
                      onCopyMessage={() => handleCopyWhatsAppMessage(item)}
                      onRegister={() => handleOpenContactModal(item)}
                      onView={() => onSelectMeeting?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bloco de Hoje */}
            {hoje.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  Para Hoje ({hoje.length})
                </div>
                <div className="grid gap-2">
                  {hoje.map((item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      isHoje
                      copiedId={copiedId}
                      onCopyMessage={() => handleCopyWhatsAppMessage(item)}
                      onRegister={() => handleOpenContactModal(item)}
                      onView={() => onSelectMeeting?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bloco de Próximos */}
            {proximos.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Próximos dias ({proximos.length})
                </div>
                <div className="grid gap-2">
                  {proximos.map((item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      copiedId={copiedId}
                      onCopyMessage={() => handleCopyWhatsAppMessage(item)}
                      onRegister={() => handleOpenContactModal(item)}
                      onView={() => onSelectMeeting?.(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Modal para Registrar Contato / Avançar Data */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-primary" />
              Registrar Contato de Follow-up
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lead: <strong>{selectedMeeting?.lead_nome}</strong>
              {selectedMeeting?.empresa ? ` (${selectedMeeting.empresa})` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">O que foi conversado/alinhado?</Label>
              <Textarea
                placeholder="Ex: Liguei e cliente informou que reunião de diretoria aprovou a proposta; combinamos retorno na quinta..."
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                className="text-sm h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nova Data de Follow-up</Label>
                <Input
                  type="date"
                  value={proximaData}
                  onChange={(e) => setProximaData(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Atualizar Resultado</Label>
                <Select value={novoResultado} onValueChange={setNovoResultado}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vai pensar">Vai pensar</SelectItem>
                    <SelectItem value="Objeção em aberto">Objeção em aberto</SelectItem>
                    <SelectItem value="Downsell aplicado">Downsell aplicado</SelectItem>
                    <SelectItem value="Reagendado">Reagendado</SelectItem>
                    <SelectItem value="Fechou">Fechou (Ganho 🎉)</SelectItem>
                    <SelectItem value="Não qualificado">Não qualificado (Perda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Integração com WhatsApp
              </p>
              <p>
                O disparo direto via API de WhatsApp está preparado na infraestrutura e aguarda
                credenciais do gateway. Use o botão <strong>"Copiar Mensagem"</strong> para colar no
                WhatsApp Web.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveContact} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar e Avançar Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function FollowUpCard({
  item,
  isAtrasado,
  isHoje,
  copiedId,
  onCopyMessage,
  onRegister,
  onView,
}: {
  item: ReuniaoComercialRecord
  isAtrasado?: boolean
  isHoje?: boolean
  copiedId: string | null
  onCopyMessage: () => void
  onRegister: () => void
  onView: () => void
}) {
  const isCopied = copiedId === item.id

  const formatData = (d?: string) => {
    if (!d) return '-'
    const [y, m, day] = d.split('-')
    if (!y || !m || !day) return d
    return `${day}/${m}/${y}`
  }

  return (
    <div
      className={`p-3 rounded-lg border text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
        isAtrasado
          ? 'bg-red-50/40 border-red-200 hover:bg-red-50/70'
          : isHoje
            ? 'bg-amber-50/40 border-amber-200 hover:bg-amber-50/70'
            : 'bg-card border-border hover:bg-muted/20'
      }`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-foreground truncate">{item.lead_nome}</span>
          {item.empresa && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3" /> {item.empresa}
            </span>
          )}
          <Badge
            variant={
              item.resultado === 'Fechou'
                ? 'default'
                : item.resultado === 'Não qualificado'
                  ? 'destructive'
                  : 'secondary'
            }
            className="text-[10px] h-4.5"
          >
            {item.resultado || 'Em andamento'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span
            className={`font-semibold flex items-center gap-1 ${
              isAtrasado ? 'text-destructive' : isHoje ? 'text-amber-700' : 'text-foreground'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Contato: {formatData(item.data_proximo_contato)}
            {isAtrasado && ' (Atrasado)'}
            {isHoje && ' (Hoje)'}
          </span>
          {item.produto_recomendado && (
            <span className="truncate max-w-[180px]">Prod: {item.produto_recomendado}</span>
          )}
          {item.proximo_passo && (
            <span className="truncate max-w-[220px] text-muted-foreground/80 italic">
              "{item.proximo_passo}"
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={onCopyMessage}
          title="Copiar mensagem personalizada de follow-up para WhatsApp"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" /> Copiado!
            </>
          ) : (
            <>
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
            </>
          )}
        </Button>

        <Button
          variant="default"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
          onClick={onRegister}
        >
          <PhoneCall className="w-3.5 h-3.5" /> Registrar Contato
        </Button>

        <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={onView}>
          Ver
        </Button>
      </div>
    </div>
  )
}
