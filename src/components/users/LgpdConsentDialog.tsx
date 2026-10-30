import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  Shield,
  Download,
  UserX,
  FileJson,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export interface LgpdSubjectData {
  id: string
  type: 'client' | 'mentee' | 'contato'
  name: string
  email?: string
  phone?: string
  cnpj?: string
  lgpd_consent?: boolean
  lgpd_consent_date?: string
  originalData?: any
}

interface LgpdConsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: LgpdSubjectData | null
  onSubjectUpdated?: () => void
}

export function LgpdConsentDialog({
  open,
  onOpenChange,
  subject,
  onSubjectUpdated,
}: LgpdConsentDialogProps) {
  const { toast } = useToast()
  const [consent, setConsent] = useState<boolean>(Boolean(subject?.lgpd_consent))
  const [isSavingConsent, setIsSavingConsent] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAnonymizing, setIsAnonymizing] = useState(false)
  const [confirmAnonymizeOpen, setConfirmAnonymizeOpen] = useState(false)

  // Sincroniza consentimento quando subject muda
  if (subject && consent !== Boolean(subject.lgpd_consent) && !isSavingConsent) {
    setConsent(Boolean(subject.lgpd_consent))
  }

  if (!subject) return null

  const getCollectionName = () => {
    if (subject.type === 'client') return 'v1_clientes'
    if (subject.type === 'mentee') return 'v1_mentees'
    return 'v1_contatos'
  }

  const handleToggleConsent = async (newVal: boolean) => {
    setConsent(newVal)
    setIsSavingConsent(true)
    const collection = getCollectionName()
    const nowIso = newVal ? new Date().toISOString() : ''

    try {
      await pb.collection(collection).update(subject.id, {
        lgpd_consent: newVal,
        lgpd_consent_date: nowIso,
      })

      if (subject.originalData) {
        subject.originalData.lgpd_consent = newVal
        subject.originalData.lgpd_consent_date = nowIso
      }
      subject.lgpd_consent = newVal
      subject.lgpd_consent_date = nowIso

      toast({
        title: newVal ? 'Consentimento Registrado' : 'Consentimento Revogado',
        description: newVal
          ? `Consentimento de ${subject.name} atualizado com data/hora.`
          : `Consentimento de ${subject.name} marcado como revogado.`,
      })
      onSubjectUpdated?.()
    } catch (err: any) {
      setConsent(!newVal)
      toast({
        title: 'Erro ao atualizar consentimento',
        description: err.message || 'Falha ao salvar no banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingConsent(false)
    }
  }

  // 1. Exportar todos os dados do titular em JSON estruturado
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const collection = getCollectionName()
      const mainRecord = await pb.collection(collection).getOne(subject.id)

      // Busca dados vinculados para portabilidade completa
      let sessoes: any[] = []
      let reunioes: any[] = []
      let propostas: any[] = []
      let transacoes: any[] = []

      try {
        if (subject.type === 'client') {
          sessoes = await pb.collection('v1_sessoes').getFullList({
            filter: `client_id = "${subject.id}"`,
          })
          propostas = await pb.collection('v1_proposals').getFullList({
            filter: `cliente_id = "${subject.id}"`,
          })
        } else if (subject.type === 'mentee') {
          sessoes = await pb.collection('v1_sessoes').getFullList({
            filter: `mentee_id = "${subject.id}"`,
          })
        }
      } catch (_) {
        // coleções opcionais
      }

      if (subject.email) {
        try {
          reunioes = await pb.collection('v1_reunioes_comerciais').getFullList({
            filter: `email = "${subject.email}"`,
          })
        } catch {
          /* intentionally ignored */
        }
      }

      const exportPayload = {
        meta: {
          app: 'SGFM - Grupo Flavio Moura',
          purpose: 'Portabilidade de Dados Pessoais - Art. 18 V da LGPD (Lei nº 13.709/2018)',
          exported_at: new Date().toISOString(),
          titular_id: subject.id,
          tipo_registro: subject.type,
        },
        titular: mainRecord,
        historico_relacionado: {
          sessoes: sessoes,
          reunioes_comerciais: reunioes,
          propostas: propostas,
        },
      }

      const jsonStr = JSON.stringify(exportPayload, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = (subject.name || 'titular').toLowerCase().replace(/[^a-z0-9]/g, '_')
      a.download = `lgpd_portabilidade_${safeName}_${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação Concluída',
        description: 'Arquivo JSON com todos os dados do titular baixado com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro na exportação',
        description: err.message || 'Não foi possível exportar os dados do titular.',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 2. Anonimizar dados do titular (substituir dados pessoais por placeholders anônimos)
  const handleAnonymize = async () => {
    setIsAnonymizing(true)
    const collection = getCollectionName()
    const anonSuffix = subject.id.slice(0, 6)

    try {
      const payload: Record<string, any> = {
        name: `Titular Anonimizado #${anonSuffix}`,
        email: `anonimo.${anonSuffix}@anonimizado.local`,
        phone: '00000000000',
        status: 'Inativo',
        lgpd_consent: false,
        lgpd_consent_date: '',
      }

      if (subject.type === 'client') {
        payload.cnpj = '00.000.000/0000-00'
      }

      await pb.collection(collection).update(subject.id, payload)

      toast({
        title: 'Dados Anonimizados',
        description: `Os dados pessoais de ${subject.name} foram anonimizados com sucesso.`,
      })
      setConfirmAnonymizeOpen(false)
      onOpenChange(false)
      onSubjectUpdated?.()
    } catch (err: any) {
      toast({
        title: 'Erro ao anonimizar',
        description: err.message || 'Falha ao anonimizar dados do titular.',
        variant: 'destructive',
      })
    } finally {
      setIsAnonymizing(false)
    }
  }

  const consentDateFormatted = subject.lgpd_consent_date
    ? new Date(subject.lgpd_consent_date).toLocaleString('pt-BR')
    : 'Não registrado'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-accent">
              <Shield className="w-5 h-5 text-primary" />
              Gestão de Privacidade & LGPD
            </DialogTitle>
            <DialogDescription className="text-xs">
              Controle de consentimento, portabilidade e direito de esquecimento/anonimização do
              titular: <strong className="text-foreground">{subject.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Status do Consentimento */}
            <div className="p-3.5 bg-muted/40 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-foreground">
                      Consentimento LGPD Ativo
                    </Label>
                    {consent ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]">
                        Concedido
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-amber-600 border-amber-300 text-[10px]"
                      >
                        Pendente / Não informado
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Titular autorizou tratamento de dados conforme política da empresa.
                  </p>
                </div>

                <Switch
                  checked={consent}
                  disabled={isSavingConsent}
                  onCheckedChange={handleToggleConsent}
                />
              </div>

              {consent && (
                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Data do consentimento:{' '}
                    <strong className="text-foreground">{consentDateFormatted}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Ações de Direitos do Titular (Art. 18 LGPD) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Direitos do Titular (LGPD)
              </Label>

              <div className="grid grid-cols-1 gap-2">
                {/* 1. Exportar Dados */}
                <div className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileJson className="w-4 h-4 text-blue-500" />
                      Exportar Dados (Portabilidade)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Baixa todos os registros cadastrais, sessões e históricos em formato JSON
                      legível.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="shrink-0 text-xs gap-1.5"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Exportar
                  </Button>
                </div>

                {/* 2. Anonimizar Titular */}
                <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                      <UserX className="w-4 h-4" />
                      Anonimizar Dados Pessoais
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Substitui dados identificadores por identificadores genéricos mantendo
                      históricos fiscais intactos.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmAnonymizeOpen(true)}
                    className="shrink-0 text-xs gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Anonimizar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação explícita para anonimização */}
      <Dialog open={confirmAnonymizeOpen} onOpenChange={setConfirmAnonymizeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Anonimização
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Tem certeza que deseja anonimizar os dados de <strong>{subject.name}</strong>?
              <br />
              <br />
              Esta ação substituirá nome, e-mail, telefone e documentos por identificadores
              anonimizados para cumprir o direito de esquecimento (Art. 18 da LGPD). Os vínculos
              financeiros e contábeis serão preservados para fins de auditoria legal.
              <br />
              <br />
              <strong>Esta ação é irreversível.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isAnonymizing}
              onClick={() => setConfirmAnonymizeOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isAnonymizing}
              onClick={handleAnonymize}
            >
              {isAnonymizing ? 'Anonimizando...' : 'Sim, Anonimizar Dados'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
