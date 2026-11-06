import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  farolService,
  type OrcamentoRegistro,
  type VersaoRegistro,
} from '@/services/farolOrcamento'
import { empresasService } from '@/services/empresas'
import {
  TIPOS_HORA,
  TIPO_HORA_LABEL,
  calcularOrcamento,
  limiteDescontoUsuario,
  fmtMoeda,
  fmtPct,
  FATOR_SEGURANCA_DEFAULT,
  type LinhaOrcamento,
  type RecursoCusto,
  type ComponenteCusto,
  type OverheadConfig,
  type AlcadaDesconto,
  type ModeloCobranca,
  type EscopoModulo,
  OVERHEAD_DEFAULT,
} from '@/lib/orcamento'
import { VersoesPanel } from '@/components/orcamento/VersoesPanel'
import { DialogoAprovacao } from '@/components/orcamento/DialogoAprovacao'
import { testMotorCalculo } from '@/lib/orcamento-test'
import { Loader2, Plus, Trash2, Save, FlaskConical } from 'lucide-react'

const MARGEM_ALVO_DEFAULT = 30

export function OrcamentosPage() {
  const { user } = useAuth()
  const [carregando, setCarregando] = useState(true)
  const [recursos, setRecursos] = useState<RecursoCusto[]>([])
  const [componentes, setComponentes] = useState<ComponenteCusto[]>([])
  const [escopos, setEscopos] = useState<EscopoModulo[]>([])
  const [modelos, setModelos] = useState<ModeloCobranca[]>([])
  const [alcadas, setAlcadas] = useState<AlcadaDesconto[]>([])
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>([])
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([])
  const [overhead, setOverhead] = useState<OverheadConfig>(OVERHEAD_DEFAULT)
  const [margemAlvo, setMargemAlvo] = useState(MARGEM_ALVO_DEFAULT)
  const [fatorSeguranca, setFatorSeguranca] = useState(FATOR_SEGURANCA_DEFAULT)

  const [orcamentoId, setOrcamentoId] = useState<string | undefined>()
  const [titulo, setTitulo] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [descontoPct, setDescontoPct] = useState(0)
  const [diasEntrega, setDiasEntrega] = useState(0)
  const [participantes, setParticipantes] = useState(0)
  const [observacoes, setObservacoes] = useState('')

  const [linhas, setLinhas] = useState<LinhaOrcamento[]>([])
  const [novoRecursoId, setNovoRecursoId] = useState('')
  const [novoTipoHora, setNovoTipoHora] = useState('entrega')
  const [novasHoras, setNovasHoras] = useState('')
  const [novoModulo, setNovoModulo] = useState('')
  const [novoComponenteId, setNovoComponenteId] = useState('')
  const [novaQtd, setNovaQtd] = useState('1')
  const [novoValorComp, setNovoValorComp] = useState('')

  const [versoes, setVersoes] = useState<VersaoRegistro[]>([])
  const [orcamentoAtual, setOrcamentoAtual] = useState<OrcamentoRegistro | null>(null)
  const [versoesCarregando, setVersoesCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [dialogoAprovOpen, setDialogoAprovOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [recs, comps, esc, mods, alc, cli, emp] = await Promise.all([
          farolService.recursos.list(),
          farolService.componentes.list(),
          farolService.escopos.list(),
          farolService.modelos.list(),
          farolService.alcadas.list(),
          farolService.apoios.clientes(),
          empresasService.list(),
        ])
        setRecursos(recs.filter((r) => r.ativo !== false))
        setComponentes(comps.filter((c) => c.ativo !== false))
        setEscopos(esc.filter((e) => e.ativo !== false))
        setModelos(mods.filter((m) => m.ativo !== false))
        setAlcadas(alc)
        setClientes(cli)
        setEmpresas(emp.map((e: any) => ({ id: e.id, nome: e.nome || e.name || '' })))
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: err?.message || 'Falha ao carregar dados.',
          variant: 'destructive',
        })
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  useEffect(() => {
    let cancelado = false
    farolService.overhead.findForEmpresa(empresaId || null).then((cfg) => {
      if (!cancelado && cfg) setOverhead(cfg)
    })
    return () => {
      cancelado = true
    }
  }, [empresaId])

  const modeloNome = modelos.find((m) => m.id === modeloId)?.nome || ''
  const limiteAlcada = useMemo(() => limiteDescontoUsuario(user, alcadas), [user, alcadas])

  const resultado = useMemo(
    () =>
      calcularOrcamento({
        linhas,
        config: {
          pct_administrativo: overhead.pct_administrativo,
          pct_financeiro: overhead.pct_financeiro,
          pct_comercial: overhead.pct_comercial,
          pct_imposto: overhead.pct_imposto,
          fator_preparacao: overhead.fator_preparacao,
          fator_seguranca: fatorSeguranca,
          margem_alvo_pct: margemAlvo,
        },
        descontoPct,
        modeloNome,
        diasEntrega,
        participantes,
      }),
    [
      linhas,
      overhead,
      fatorSeguranca,
      margemAlvo,
      descontoPct,
      modeloNome,
      diasEntrega,
      participantes,
    ],
  )

  const precisaAprovacao = limiteAlcada !== null && descontoPct > limiteAlcada

  // ----- linhas -----
  const addLinhaHora = () => {
    const rec = recursos.find((r) => r.id === novoRecursoId)
    if (!rec) {
      toast({
        title: 'Atenção',
        description: 'Escolha um recurso de custo.',
        variant: 'destructive',
      })
      return
    }
    const horas = parseFloat(novasHoras.replace(',', '.')) || 0
    if (horas <= 0) {
      toast({ title: 'Atenção', description: 'Informe as horas.', variant: 'destructive' })
      return
    }
    setLinhas([
      ...linhas,
      {
        tipo: 'hora',
        recurso_id: rec.id,
        recurso_nome: rec.profissional_nome,
        profissional_id: rec.profissional_id || rec.id,
        tipo_hora: novoTipoHora as any,
        horas,
        custo_hora: rec.custo_hora,
        modulo_nome: escopos.find((e) => e.id === novoModulo)?.nome,
      },
    ])
    setNovasHoras('')
  }

  const addLinhaComponente = () => {
    const esc = escopos.find((e) => e.id === novoComponenteId)
    const comp = componentes.find((c) => c.id === novoComponenteId)
    if (!esc && !comp) {
      toast({
        title: 'Atenção',
        description: 'Escolha um componente ou módulo de escopo.',
        variant: 'destructive',
      })
      return
    }
    const qtd = parseFloat(novaQtd.replace(',', '.')) || 0
    if (qtd <= 0) {
      toast({ title: 'Atenção', description: 'Informe a quantidade.', variant: 'destructive' })
      return
    }
    if (esc) {
      const valor = parseFloat(novoValorComp.replace(',', '.')) || 0
      setLinhas([
        ...linhas,
        {
          tipo: 'componente',
          componente_nome: esc.nome,
          unidade: 'módulo',
          quantidade: qtd,
          valor_unitario: valor,
          modulo_nome: esc.nome,
        },
      ])
    } else if (comp) {
      setLinhas([
        ...linhas,
        {
          tipo: 'componente',
          componente_id: comp.id,
          componente_nome: comp.nome,
          unidade: comp.unidade || 'un',
          quantidade: qtd,
          valor_unitario: parseFloat(novoValorComp.replace(',', '.')) || comp.valor_padrao,
          reembolsavel: Boolean(comp.reembolsavel),
        },
      ])
    }
    setNovaQtd('1')
    setNovoValorComp('')
  }

  const removerLinha = (idx: number) => setLinhas(linhas.filter((_, i) => i !== idx))

  // ----- salvar / versões -----
  const carregarVersoes = async (orcId: string) => {
    setVersoesCarregando(true)
    try {
      const [vs, oc] = await Promise.all([
        farolService.orcamentos.versoes(orcId),
        farolService.orcamentos.get(orcId),
      ])
      setVersoes(vs)
      setOrcamentoAtual(oc)
    } finally {
      setVersoesCarregando(false)
    }
  }

  const salvarComAprovacao = async (
    aprovadorEmail: string,
    aprovadorNome: string,
    motivo: string,
  ) => {
    await salvar({
      aprovacao: {
        precisa: true,
        aprovador_email: aprovadorEmail,
        aprovador_nome: aprovadorNome,
        motivo,
        desconto_pct: descontoPct,
        data: new Date().toISOString(),
        versao_id: '',
      },
    })
  }

  const salvar = async (extra?: { aprovacao?: any }) => {
    if (!titulo.trim() || !clienteId || !empresaId || !modeloId) {
      toast({
        title: 'Atenção',
        description: 'Preencha título, cliente, empresa e modelo de cobrança.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      const { orcamento, versao } = await farolService.orcamentos.salvarVersao({
        orcamentoId,
        titulo: titulo.trim(),
        cliente_id: clienteId,
        empresa_id: empresaId,
        modelo_id: modeloId,
        escopo: {
          modelo_nome: modeloNome,
          desconto_pct: descontoPct,
          config: {
            pct_imposto: overhead.pct_imposto,
            fator_seguranca: fatorSeguranca,
            margem_alvo_pct: margemAlvo,
          },
          linhas,
          observacoes: observacoes.trim(),
          aprovacao: extra?.aprovacao ?? null,
        },
        totals: {
          custo_total: resultado.custo_direto,
          preco_minimo: resultado.preco_minimo,
          preco_sugerido: resultado.preco_sugerido,
          preco_final: resultado.preco_final,
          desconto_pct: descontoPct,
          margem_alvo: margemAlvo,
          margem_real_pct: resultado.margem_real_pct,
        },
        autor: { id: user?.id || '', nome: user?.name || user?.email || '—' },
      })
      setOrcamentoId(orcamento.id)
      setOrcamentoAtual(orcamento)
      await carregarVersoes(orcamento.id)
      toast({
        title: extra?.aprovacao ? 'Versão salva com aprovação' : 'Versão salva',
        description: `v${versao.versao} gravada com data, autor e variação de margem.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description:
          err?.response?.message ||
          err?.message ||
          'Falha ao salvar versão. Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const clicouSalvar = async () => {
    if (precisaAprovacao) {
      setDialogoAprovOpen(true)
      return
    }
    await salvar()
  }

  const aprovar = async (orcId: string, versaoId: string) => {
    try {
      await farolService.orcamentos.aprovarVersao(orcId, versaoId)
      await carregarVersoes(orcId)
      toast({ title: 'Versão aprovada', description: 'versao_aprovada_id gravado no orçamento.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao aprovar.',
        variant: 'destructive',
      })
    }
  }

  const abrirOrcamento = async (o: OrcamentoRegistro) => {
    setOrcamentoId(o.id)
    setTitulo(o.titulo)
    setClienteId(o.cliente_id || '')
    setEmpresaId(o.empresa_id || '')
    setModeloId(o.modelo_id || '')
    const vs = await farolService.orcamentos.versoes(o.id)
    setVersoes(vs)
    setOrcamentoAtual(o)
    const ultima = vs[0]
    if (ultima?.dados_json) {
      const d = ultima.dados_json as any
      setLinhas(Array.isArray(d.linhas) ? d.linhas : [])
      setDescontoPct(d.desconto_pct || 0)
      setObservacoes(d.observacoes || '')
      if (d.config) {
        setMargemAlvo(d.config.margem_alvo_pct ?? MARGEM_ALVO_DEFAULT)
        setFatorSeguranca(d.config.fator_seguranca ?? FATOR_SEGURANCA_DEFAULT)
        if (typeof d.config.pct_imposto === 'number') {
          setOverhead({ ...OVERHEAD_DEFAULT, pct_imposto: d.config.pct_imposto })
        }
      }
    }
  }

  const rodarTestes = () => {
    const res = testMotorCalculo()
    const falhas = res.filter((c) => !c.ok)
    if (falhas.length === 0) {
      toast({ title: 'Motor OK', description: `${res.length} verificações passaram.` })
    } else {
      toast({
        title: 'Falhas no motor',
        description: falhas.map((f) => `${f.nome}: ${f.detalhe}`).join(' | '),
        variant: 'destructive',
      })
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando simulador...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Simulador de Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Farol Comercial — o preço nunca é digitado: é derivado de custo + overhead + imposto +
            margem.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={rodarTestes}>
          <FlaskConical className="w-4 h-4 mr-1" /> Testar motor
        </Button>
      </div>

      {/* Identificação */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1 · Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Nome do projeto *</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Programa de Liderança 2027"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Empresa *</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Modelo de cobrança *</Label>
            <Select value={modeloId} onValueChange={setModeloId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modeloNome.toLowerCase().includes('dia') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Dias de entrega</Label>
              <Input
                type="number"
                min="0"
                value={diasEntrega || ''}
                onChange={(e) => setDiasEntrega(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
          {modeloNome.toLowerCase().includes('participante') && (
            <div className="space-y-1.5">
              <Label className="text-xs">Participantes</Label>
              <Input
                type="number"
                min="0"
                value={participantes || ''}
                onChange={(e) => setParticipantes(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composição */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2 · Composição de linhas</CardTitle>
          <CardDescription>
            Horas por recurso (entrega, preparação, deslocamento, relatoria) e componentes/módulos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Linha de hora
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Módulo de escopo (opcional)</Label>
                  <Select value={novoModulo} onValueChange={setNovoModulo}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {escopos.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Recurso</Label>
                  <Select value={novoRecursoId} onValueChange={setNovoRecursoId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Escolha o recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      {recursos.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.profissional_nome} · {TIPO_HORA_LABEL[r.tipo_hora]} ·{' '}
                          {fmtMoeda(r.custo_hora)}/h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de hora</Label>
                  <Select value={novoTipoHora} onValueChange={setNovoTipoHora}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_HORA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horas</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={novasHoras}
                    onChange={(e) => setNovasHoras(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <Button size="sm" onClick={addLinhaHora}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar hora
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Linha de componente / módulo
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Componente do catálogo ou módulo de escopo</Label>
                  <Select value={novoComponenteId} onValueChange={setNovoComponenteId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      {componentes.length > 0 && (
                        <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">
                          Catálogo
                        </div>
                      )}
                      {componentes.map((c) => (
                        <SelectItem key={`c-${c.id}`} value={c.id}>
                          {c.nome} · {fmtMoeda(c.valor_padrao)}
                          {c.reembolsavel ? ' (reemb.)' : ''}
                        </SelectItem>
                      ))}
                      {escopos.length > 0 && (
                        <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">
                          Módulos de escopo
                        </div>
                      )}
                      {escopos.map((e) => (
                        <SelectItem key={`e-${e.id}`} value={e.id}>
                          {e.nome} (módulo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={novaQtd}
                    onChange={(e) => setNovaQtd(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor unitário (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={novoValorComp}
                    onChange={(e) => setNovoValorComp(e.target.value)}
                    placeholder="vazio = padrão"
                    className="h-9"
                  />
                </div>
              </div>
              <Button size="sm" onClick={addLinhaComponente}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar componente
              </Button>
            </div>
          </div>

          {linhas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma linha — adicione horas ou componentes acima.
            </p>
          ) : (
            <div className="space-y-1.5">
              {linhas.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Badge variant={l.tipo === 'hora' ? 'default' : 'outline'} className="shrink-0">
                    {l.tipo === 'hora' ? 'hora' : 'item'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {l.tipo === 'hora' ? l.recurso_nome : l.componente_nome}
                      {l.modulo_nome ? ` · ${l.modulo_nome}` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.tipo === 'hora'
                        ? `${TIPO_HORA_LABEL[l.tipo_hora]} · ${l.horas}h × ${fmtMoeda(l.custo_hora)}`
                        : `${l.quantidade} ${l.unidade || 'un'} × ${fmtMoeda(l.valor_unitario)}${l.reembolsavel ? ' · reembolsável' : ''}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removerLinha(i)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preço */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">3 · Preço e margem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metrica label="Custo total" valor={fmtMoeda(resultado.custo_direto)} />
            <Metrica
              label="Preço mínimo"
              valor={fmtMoeda(resultado.preco_minimo)}
              destaque="muted"
            />
            <Metrica
              label="Preço sugerido"
              valor={fmtMoeda(resultado.preco_sugerido)}
              destaque="primary"
            />
            <Metrica
              label={`Ponto de equilíbrio${resultado.ponto_equilibrio_unidade ? ` (${resultado.ponto_equilibrio_unidade})` : ''}`}
              valor={resultado.ponto_equilibrio === null ? '—' : String(resultado.ponto_equilibrio)}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Desconto (%)</Label>
              <Input
                type="number"
                min="0"
                max="90"
                step="0.5"
                value={descontoPct || ''}
                onChange={(e) => setDescontoPct(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Margem alvo (%)</Label>
              <Input
                type="number"
                min="0"
                max="90"
                step="1"
                value={margemAlvo || ''}
                onChange={(e) => setMargemAlvo(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fator de segurança (×)</Label>
              <Input
                type="number"
                min="1"
                max="3"
                step="0.05"
                value={fatorSeguranca || ''}
                onChange={(e) =>
                  setFatorSeguranca(parseFloat(e.target.value) || FATOR_SEGURANCA_DEFAULT)
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metrica
              label="Preço final (c/ desconto)"
              valor={fmtMoeda(resultado.preco_final)}
              destaque="primary"
            />
            <Metrica
              label="Margem real"
              valor={fmtPct(resultado.margem_real_pct)}
              cor={resultado.margem_real_pct < margemAlvo - 5 ? 'text-red-600' : 'text-green-700'}
            />
            <Metrica label="Reembolsável (fora)" valor={fmtMoeda(resultado.total_reembolsavel)} />
            <Metrica label="Total ao cliente" valor={fmtMoeda(resultado.total_ao_cliente)} />
          </div>
          {precisaAprovacao && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Desconto de {fmtPct(descontoPct)} excede a alçada do seu perfil
              {limiteAlcada !== null ? ` (${fmtPct(limiteAlcada)})` : ''} — ao salvar será exigido
              aprovador e motivo.
            </div>
          )}
          {resultado.avisos.map((a, i) => (
            <div key={i} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
              {a}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Observações (vão para a versão)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Condições, premissas, validade..."
            />
          </div>
          <Button onClick={clicouSalvar} disabled={salvando} size="lg">
            {salvando ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {salvando
              ? 'Salvando...'
              : orcamentoId
                ? 'Salvar nova versão'
                : 'Salvar orçamento (v1)'}
          </Button>
        </CardContent>
      </Card>

      <DialogoAprovacao
        open={dialogoAprovOpen}
        onOpenChange={setDialogoAprovOpen}
        descontoPct={descontoPct}
        limitePct={limiteAlcada}
        user={user}
        alcadas={alcadas}
        onConfirm={salvarComAprovacao}
      />

      <VersoesPanel
        orcamento={orcamentoAtual}
        versoes={versoes}
        carregando={versoesCarregando}
        onAprovar={aprovar}
        onAbrir={abrirOrcamento}
      />
    </div>
  )
}

function Metrica({
  label,
  valor,
  destaque,
  cor,
}: {
  label: string
  valor: string
  destaque?: 'primary' | 'muted'
  cor?: string
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${destaque === 'primary' ? 'border-primary/40 bg-primary/5' : destaque === 'muted' ? 'bg-muted/30' : ''}`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${cor || ''}`}>{valor}</div>
    </div>
  )
}
