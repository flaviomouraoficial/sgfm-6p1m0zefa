import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { farolService } from '@/services/farolOrcamento'
import {
  TIPOS_HORA,
  TIPO_HORA_LABEL,
  fmtMoeda,
  type TipoHora,
  type RecursoCusto,
  type ComponenteCusto,
  type OverheadConfig,
  type AlcadaDesconto,
  type ModeloCobranca,
  OVERHEAD_DEFAULT,
} from '@/lib/orcamento'
import { Loader2, Plus, Trash2, Coins } from 'lucide-react'

interface RecursoForm {
  profissional_nome: string
  tipo_hora: TipoHora
  custo_hora: string
  observacoes: string
}

const recursoVazio: RecursoForm = {
  profissional_nome: '',
  tipo_hora: 'entrega',
  custo_hora: '',
  observacoes: '',
}

interface ComponenteForm {
  nome: string
  categoria: string
  unidade: string
  valor_padrao: string
  reembolsavel: boolean
}

const componenteVazio: ComponenteForm = {
  nome: '',
  categoria: '',
  unidade: 'un',
  valor_padrao: '',
  reembolsavel: false,
}

export function CustosCard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.email === 'flavio@trendconsultoria.com.br'
  const [carregando, setCarregando] = useState(true)
  const [recursos, setRecursos] = useState<RecursoCusto[]>([])
  const [componentes, setComponentes] = useState<ComponenteCusto[]>([])
  const [alcadas, setAlcadas] = useState<AlcadaDesconto[]>([])
  const [modelos, setModelos] = useState<ModeloCobranca[]>([])
  const [perfis, setPerfis] = useState<{ id: string; name: string }[]>([])
  const [empresas, setEmpresas] = useState<{ id: string; nome: string }[]>([])
  const [empresaSel, setEmpresaSel] = useState<string>('')
  const [overhead, setOverhead] = useState<OverheadConfig>(OVERHEAD_DEFAULT)
  const [overheadCarregado, setOverheadCarregado] = useState(false)

  const [formRecurso, setFormRecurso] = useState<RecursoForm>(recursoVazio)
  const [formComponente, setFormComponente] = useState<ComponenteForm>(componenteVazio)

  const carregar = async () => {
    setCarregando(true)
    try {
      const [recs, comps, alc, mods, perfisRes, empresasRes] = await Promise.all([
        farolService.recursos.list(),
        farolService.componentes.list(),
        farolService.alcadas.list(),
        farolService.modelos.list(),
        farolService.apoios.perfis(),
        pb.collection('v1_empresas').getFullList<{ id: string; nome: string }>({ sort: 'nome' }),
      ])
      setRecursos(recs)
      setComponentes(comps)
      setModelos(mods)
      setEmpresas(
        empresasRes.map((e) => ({
          id: e.id,
          nome: (e as any).nome || (e as any).name || 'Empresa',
        })),
      )
      setPerfis(perfisRes)
      // Alçadas: semeia na primeira abertura com os perfis existentes (pct_max = 0).
      if (perfisRes.length > 0 && alc.length === 0) {
        const criou = await farolService.alcadas.seedFromPerfis()
        if (criou) {
          setAlcadas(await farolService.alcadas.list())
          toast({
            title: 'Alçadas criadas',
            description:
              'Perfis de acesso semeados com % máximo de desconto = 0. Ajuste conforme a política comercial.',
          })
          return
        }
      }
      setAlcadas(alc)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao carregar dados de custo.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    let cancelado = false
    setOverheadCarregado(false)
    farolService.overhead.findForEmpresa(empresaSel || null).then((cfg) => {
      if (cancelado) return
      setOverhead(cfg || OVERHEAD_DEFAULT)
      setOverheadCarregado(true)
    })
    return () => {
      cancelado = true
    }
  }, [empresaSel])

  const salvarRecurso = async () => {
    if (!formRecurso.profissional_nome.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do recurso.', variant: 'destructive' })
      return
    }
    const custo = parseFloat(formRecurso.custo_hora.replace(',', '.')) || 0
    try {
      await farolService.recursos.create({
        profissional_nome: formRecurso.profissional_nome.trim(),
        tipo_hora: formRecurso.tipo_hora,
        custo_hora: custo,
        observacoes: formRecurso.observacoes.trim(),
        ativo: true,
      })
      setFormRecurso(recursoVazio)
      setRecursos(await farolService.recursos.list())
      toast({ title: 'Recurso cadastrado', description: 'Custo por hora salvo.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar recurso.',
        variant: 'destructive',
      })
    }
  }

  const alternarRecurso = async (r: RecursoCusto) => {
    try {
      await farolService.recursos.update(r.id, { ativo: !r.ativo })
      setRecursos(await farolService.recursos.list())
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao atualizar recurso.',
        variant: 'destructive',
      })
    }
  }

  const salvarComponente = async () => {
    if (!formComponente.nome.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o nome do componente.',
        variant: 'destructive',
      })
      return
    }
    try {
      await farolService.componentes.create({
        nome: formComponente.nome.trim(),
        categoria: formComponente.categoria.trim(),
        unidade: formComponente.unidade.trim() || 'un',
        valor_padrao: parseFloat(formComponente.valor_padrao.replace(',', '.')) || 0,
        reembolsavel: formComponente.reembolsavel,
        ativo: true,
      })
      setFormComponente(componenteVazio)
      setComponentes(await farolService.componentes.list())
      toast({ title: 'Componente cadastrado', description: 'Item do catálogo de custos salvo.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar componente.',
        variant: 'destructive',
      })
    }
  }

  const alternarComponente = async (c: ComponenteCusto) => {
    try {
      await farolService.componentes.update(c.id, { ativo: !c.ativo })
      setComponentes(await farolService.componentes.list())
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao atualizar componente.',
        variant: 'destructive',
      })
    }
  }

  const salvarOverhead = async () => {
    try {
      await farolService.overhead.save(empresaSel || null, overhead)
      toast({ title: 'Overhead salvo', description: 'Percentuais aplicados aos novos orçamentos.' })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar overhead.',
        variant: 'destructive',
      })
    }
  }

  const salvarAlcada = async (perfil: { id: string; name: string }, pct: number) => {
    const nome = String(perfil?.name || '')
    try {
      await farolService.alcadas.save(perfil.id, nome, pct)
      setAlcadas(await farolService.alcadas.list())
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao salvar alçada.',
        variant: 'destructive',
      })
    }
  }

  const alternarModelo = async (m: ModeloCobranca) => {
    try {
      await farolService.modelos.setActive(m.id, !m.ativo)
      setModelos(await farolService.modelos.list())
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Falha ao atualizar modelo.',
        variant: 'destructive',
      })
    }
  }

  const pctDe = (perfilNome?: string) =>
    alcadas.find((a) => (a.perfil_nome || '').toLowerCase() === (perfilNome || '').toLowerCase())
      ?.pct_max ?? 0

  if (!isAdmin) {
    return (
      <Card className="shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Custos e Alçadas
          </CardTitle>
          <CardDescription>Apenas administradores acessam esta área.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" /> Custos e Alçadas (Farol Comercial)
        </CardTitle>
        <CardDescription>
          Recursos e seus custos por hora, componentes reembolsáveis, overhead/imposto por empresa,
          alçadas de desconto e modelos de cobrança.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados de custo...
          </div>
        ) : (
          <Tabs defaultValue="recursos">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="recursos">Recursos de custo</TabsTrigger>
              <TabsTrigger value="componentes">Componentes</TabsTrigger>
              <TabsTrigger value="overhead">Overhead / Imposto</TabsTrigger>
              <TabsTrigger value="alcadas">Alçadas de desconto</TabsTrigger>
              <TabsTrigger value="modelos">Modelos de cobrança</TabsTrigger>
            </TabsList>

            {/* --- Recursos --- */}
            <TabsContent value="recursos" className="space-y-4 pt-4">
              <div className="grid sm:grid-cols-5 gap-3 items-end bg-muted/20 p-4 rounded-lg border border-dashed">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Nome do recurso / profissional</Label>
                  <Input
                    value={formRecurso.profissional_nome}
                    onChange={(e) =>
                      setFormRecurso({ ...formRecurso, profissional_nome: e.target.value })
                    }
                    placeholder="Ex: Flávio Moura (sênior)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de hora</Label>
                  <Select
                    value={formRecurso.tipo_hora}
                    onValueChange={(v) =>
                      setFormRecurso({ ...formRecurso, tipo_hora: v as TipoHora })
                    }
                  >
                    <SelectTrigger>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Custo/hora (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formRecurso.custo_hora}
                    onChange={(e) => setFormRecurso({ ...formRecurso, custo_hora: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <Button onClick={salvarRecurso} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Cadastrar
                </Button>
                <div className="sm:col-span-4">
                  <Input
                    value={formRecurso.observacoes}
                    onChange={(e) =>
                      setFormRecurso({ ...formRecurso, observacoes: e.target.value })
                    }
                    placeholder="Observações (opcional): vínculo CLT/PJ, senioridade..."
                  />
                </div>
              </div>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Tipo de hora</TableHead>
                      <TableHead className="text-right">Custo/hora</TableHead>
                      <TableHead className="text-center">Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recursos.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground text-sm py-6"
                        >
                          Nenhum recurso cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recursos.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.profissional_nome}
                            {r.observacoes && (
                              <span className="block text-xs text-muted-foreground">
                                {r.observacoes}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {TIPO_HORA_LABEL[r.tipo_hora] || r.tipo_hora}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{fmtMoeda(r.custo_hora)}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={Boolean(r.ativo)}
                              onCheckedChange={() => alternarRecurso(r)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* --- Componentes --- */}
            <TabsContent value="componentes" className="space-y-4 pt-4">
              <div className="grid sm:grid-cols-5 gap-3 items-end bg-muted/20 p-4 rounded-lg border border-dashed">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Nome do componente</Label>
                  <Input
                    value={formComponente.nome}
                    onChange={(e) => setFormComponente({ ...formComponente, nome: e.target.value })}
                    placeholder="Ex: Material impresso, Passagem aérea"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Input
                    value={formComponente.unidade}
                    onChange={(e) =>
                      setFormComponente({ ...formComponente, unidade: e.target.value })
                    }
                    placeholder="un / participante / projeto"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor padrão (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formComponente.valor_padrao}
                    onChange={(e) =>
                      setFormComponente({ ...formComponente, valor_padrao: e.target.value })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      id="comp-reemb"
                      checked={formComponente.reembolsavel}
                      onCheckedChange={(v) =>
                        setFormComponente({ ...formComponente, reembolsavel: v })
                      }
                    />
                    <Label htmlFor="comp-reemb" className="text-xs">
                      Reembolsável
                    </Label>
                  </div>
                  <Button onClick={salvarComponente} size="sm" className="ml-auto">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Componente</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Valor padrão</TableHead>
                      <TableHead className="text-center">Reembolsável</TableHead>
                      <TableHead className="text-center">Ativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground text-sm py-6"
                        >
                          Nenhum componente cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      componentes.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell>{c.unidade || 'un'}</TableCell>
                          <TableCell className="text-right">{fmtMoeda(c.valor_padrao)}</TableCell>
                          <TableCell className="text-center">
                            {c.reembolsavel ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Sim
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={Boolean(c.ativo)}
                              onCheckedChange={() => alternarComponente(c)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* --- Overhead --- */}
            <TabsContent value="overhead" className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1.5 w-full sm:w-72">
                  <Label className="text-xs">Empresa</Label>
                  <Select value={empresaSel} onValueChange={setEmpresaSel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Padrão (sem empresa)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="padrao">Padrão (todas as empresas)</SelectItem>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={salvarOverhead} disabled={!overheadCarregado}>
                  Salvar overhead
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-muted/20 p-4 rounded-lg border border-dashed">
                <div className="space-y-1.5">
                  <Label className="text-xs">Administrativo (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={overhead.pct_administrativo}
                    onChange={(e) =>
                      setOverhead({
                        ...overhead,
                        pct_administrativo: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Financeiro (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={overhead.pct_financeiro}
                    onChange={(e) =>
                      setOverhead({ ...overhead, pct_financeiro: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comercial (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={overhead.pct_comercial}
                    onChange={(e) =>
                      setOverhead({ ...overhead, pct_comercial: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Imposto (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="99"
                    value={overhead.pct_imposto}
                    onChange={(e) =>
                      setOverhead({ ...overhead, pct_imposto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fator de preparação (×)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={overhead.fator_preparacao}
                    onChange={(e) =>
                      setOverhead({
                        ...overhead,
                        fator_preparacao: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Overhead total:{' '}
                <strong>
                  {(
                    overhead.pct_administrativo +
                    overhead.pct_financeiro +
                    overhead.pct_comercial
                  ).toFixed(0)}
                  %
                </strong>{' '}
                sobre o custo direto · imposto de <strong>{overhead.pct_imposto}%</strong> sobre o
                preço · cada hora de entrega embute <strong>{overhead.fator_preparacao}×</strong> de
                preparação. Padrão aprovado: 25% / 8% / 2,0×.
              </p>
            </TabsContent>

            {/* --- Alçadas --- */}
            <TabsContent value="alcadas" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                % máximo de desconto que cada perfil de acesso pode conceder sem aprovação. Admin e
                o titular da conta não têm teto. Perfis sem registro aqui = 0%.
              </p>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Perfil de acesso</TableHead>
                      <TableHead className="w-40 text-right">% máximo de desconto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfis.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground text-sm py-6"
                        >
                          Nenhum perfil de acesso cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      perfis.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              defaultValue={pctDe(p.name || '')}
                              onBlur={(e) => {
                                const pct = Math.min(
                                  100,
                                  Math.max(0, parseFloat(e.target.value) || 0),
                                )
                                if (pct !== pctDe(p.name)) salvarAlcada(p, pct)
                              }}
                              className="text-right"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* --- Modelos --- */}
            <TabsContent value="modelos" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Ativar ou desativar modelos de cobrança (nada é excluído). Os ativos aparecem no
                Simulador de Orçamento.
              </p>
              <div className="flex flex-wrap gap-2">
                {modelos.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</span>
                ) : (
                  modelos.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${
                        m.ativo ? 'border-primary/40 bg-primary/5' : 'opacity-60'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">{m.nome}</div>
                        {m.descricao && (
                          <div className="text-xs text-muted-foreground">{m.descricao}</div>
                        )}
                      </div>
                      <Switch
                        checked={Boolean(m.ativo)}
                        onCheckedChange={() => alternarModelo(m)}
                      />
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
