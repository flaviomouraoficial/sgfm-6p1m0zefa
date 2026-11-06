import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  farolService,
  type OrcamentoRegistro,
  type VersaoRegistro,
} from '@/services/farolOrcamento'
import { fmtMoeda, fmtPct } from '@/lib/orcamento'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface VersoesPanelProps {
  orcamento: OrcamentoRegistro | null
  versoes: VersaoRegistro[]
  carregando: boolean
  onAprovar: (orcamentoId: string, versaoId: string) => Promise<void>
  onAbrir: (o: OrcamentoRegistro) => void
}

export function VersoesPanel({
  orcamento,
  versoes,
  carregando,
  onAprovar,
  onAbrir,
}: VersoesPanelProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.email === 'flavio@trendconsultoria.com.br'
  const [aprovingId, setAprovingId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<OrcamentoRegistro[]>([])

  useEffect(() => {
    if (!isAdmin) return
    farolService.orcamentos
      .list()
      .then(setOrcamentos)
      .catch(() => setOrcamentos([]))
  }, [orcamento?.id, isAdmin])

  const aprovadaId = orcamento?.versao_aprovada_id || ''

  const statusBadge = (v: VersaoRegistro) => {
    if (v.id === aprovadaId)
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovada</Badge>
    if (v.status === 'aprovada')
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovada</Badge>
    return <Badge variant="secondary">Rascunho</Badge>
  }

  return (
    <Card className="shadow-sm mt-6">
      <CardHeader>
        <CardTitle>Histórico de versões</CardTitle>
        <CardDescription>
          Cada salvamento gera uma versão com data, autor e variação de margem vs. anterior.
          Aprovada fica travada como <span className="font-medium">versao_aprovada_id</span> do
          orçamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin && orcamentos.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs">Abrir orçamento existente</Label>
            <select
              className="mt-1 w-full max-w-md border rounded-md px-3 py-2 text-sm bg-background"
              value={orcamento?.id || ''}
              onChange={(e) => {
                const alvo = orcamentos.find((o) => o.id === e.target.value)
                if (alvo) onAbrir(alvo)
              }}
            >
              <option value="">— Novo orçamento —</option>
              {orcamentos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.titulo || '(sem título)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando versões...
          </div>
        ) : !orcamento ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhuma versão ainda — salve o orçamento para criar a primeira.
          </p>
        ) : versoes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhuma versão gravada para este orçamento.
          </p>
        ) : (
          <div className="space-y-2">
            {versoes.map((v) => {
              const aprov = v.id === aprovadaId || v.status === 'aprovada'
              return (
                <div
                  key={v.id}
                  className={`rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-2 ${
                    aprov ? 'border-green-300 bg-green-50/50' : ''
                  }`}
                >
                  <div className="md:w-24">
                    <div className="font-semibold text-sm">v{v.versao}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.created ? new Date(v.created).toLocaleDateString('pt-BR') : ''}
                    </div>
                  </div>
                  <div className="md:w-36 text-sm">
                    <div className="font-medium">{v.autor_nome || '—'}</div>
                    <div className="text-xs text-muted-foreground">autor</div>
                  </div>
                  <div className="md:w-28 text-sm text-right">
                    {fmtMoeda(v.preco_final)}
                    <div className="text-xs text-muted-foreground">preço final</div>
                  </div>
                  <div className="md:w-28 text-sm text-right">
                    {fmtMoeda(v.custo_total)}
                    <div className="text-xs text-muted-foreground">custo total</div>
                  </div>
                  <div className="md:w-28 text-sm text-right">
                    {fmtPct(v.margem_real_pct)}
                    <div className="text-xs text-muted-foreground">margem real</div>
                  </div>
                  <div className="md:w-24 text-sm text-right">
                    {v.margem_variacao === null || v.margem_variacao === undefined ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={
                          v.margem_variacao >= 0 ? 'text-green-700 text-sm' : 'text-red-600 text-sm'
                        }
                      >
                        {v.margem_variacao >= 0 ? '▲' : '▼'} {fmtPct(Math.abs(v.margem_variacao))}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">Δ vs anterior</div>
                  </div>
                  <div className="flex items-center gap-2 md:ml-auto">
                    {statusBadge(v)}
                    {isAdmin && !aprov && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={aprovingId === v.id}
                        onClick={async () => {
                          setAprovingId(v.id)
                          try {
                            await onAprovar(orcamento.id, v.id)
                          } finally {
                            setAprovingId(null)
                          }
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar versão
                      </Button>
                    )}
                  </div>
                  {v.observacoes && (
                    <div className="w-full text-xs text-muted-foreground md:order-last">
                      Obs.: {v.observacoes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
