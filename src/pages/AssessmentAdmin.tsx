import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAssessmentStore } from '@/stores/assessment'
import { useMainStore } from '@/stores/main'
import { useAuth } from '@/hooks/use-auth'
import { Copy, Plus, FileText, BarChart2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { RadarChartComp } from '@/components/assessment/RadarChartComp'
import { useRealtime } from '@/hooks/use-realtime'
import { QuestionManager } from '@/components/assessment/QuestionManager'

export default function AssessmentAdmin() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    links,
    respostas,
    calculos,
    questions,
    fetchLinks,
    fetchRespostas,
    fetchCalculos,
    fetchQuestions,
    createLink,
    updateQuestion,
  } = useAssessmentStore()
  const { clients } = useMainStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    cliente_id: '',
    quantidade_permitida: 10,
    data_expiracao: '',
  })
  const [selectedClientConsolidated, setSelectedClientConsolidated] = useState<string>('all')

  useEffect(() => {
    fetchLinks()
    fetchRespostas()
    fetchCalculos()
    fetchQuestions()
  }, [])

  useRealtime(
    'v1_assessment_respostas',
    () => {
      fetchRespostas()
      fetchCalculos()
    },
    true,
  )

  useRealtime(
    'v1_assessment_links',
    () => {
      fetchLinks()
    },
    true,
  )

  useRealtime(
    'v1_assessment_questions',
    () => {
      fetchQuestions()
    },
    true,
  )

  const handleCreateLink = async () => {
    if (!formData.cliente_id || formData.quantidade_permitida < 1) return
    const randomSlug = Math.random().toString(36).substring(2, 8) + Date.now().toString(36)

    await createLink({
      cliente_id: formData.cliente_id,
      quantidade_permitida: formData.quantidade_permitida,
      data_expiracao: formData.data_expiracao || undefined,
      link_unico: randomSlug,
      status: 'ativo',
      quantidade_usada: 0,
      criado_por: user?.id,
    })

    setCreateOpen(false)
    setFormData({ cliente_id: '', quantidade_permitida: 10, data_expiracao: '' })
    toast({ title: 'Link criado com sucesso!' })
  }

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/assessment/${slug}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link copiado!' })
  }

  const getConsolidatedData = () => {
    let filteredRespostas = respostas
    if (selectedClientConsolidated !== 'all') {
      filteredRespostas = respostas.filter((r) => r.cliente_id === selectedClientConsolidated)
    }

    if (filteredRespostas.length === 0) return null

    let sums = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0, p7: 0, p8: 0, p9: 0, agro: 0 }
    let count = 0

    filteredRespostas.forEach((r) => {
      const calc = calculos.find((c) => c.resposta_id === r.id)
      if (calc) {
        sums.p1 += calc.pilar_1_media
        sums.p2 += calc.pilar_2_media
        sums.p3 += calc.pilar_3_media
        sums.p4 += calc.pilar_4_media
        sums.p5 += calc.pilar_5_media
        sums.p6 += calc.pilar_6_media
        sums.p7 += calc.pilar_7_media
        sums.p8 += calc.pilar_8_media
        sums.p9 += calc.pilar_9_media
        sums.agro += calc.mapeamento_agro_media
        count++
      }
    })

    if (count === 0) return null

    return [
      { subject: 'Maturidade', value: sums.p1 / count, fullMark: 5 },
      { subject: 'Competências', value: sums.p2 / count, fullMark: 5 },
      { subject: 'Intel. Emocional', value: sums.p3 / count, fullMark: 5 },
      { subject: 'Visão Estratégica', value: sums.p4 / count, fullMark: 5 },
      { subject: 'Liderança', value: sums.p5 / count, fullMark: 5 },
      { subject: 'Integridade', value: sums.p6 / count, fullMark: 5 },
      { subject: 'Comunicação', value: sums.p7 / count, fullMark: 5 },
      { subject: 'Adaptabilidade', value: sums.p8 / count, fullMark: 5 },
      { subject: 'Rel. Familiar', value: sums.p9 / count, fullMark: 5 },
      { subject: 'Map. Agro', value: sums.agro / count, fullMark: 5 },
    ]
  }

  const consolidatedData = getConsolidatedData()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments de Sucessão</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os links e acompanhe os resultados do assessment.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Link de Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite de Respostas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantidade_permitida}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantidade_permitida: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expira em (Opcional)</Label>
                  <Input
                    type="date"
                    value={formData.data_expiracao}
                    onChange={(e) => setFormData({ ...formData, data_expiracao: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleCreateLink}>
                Gerar Link Único
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="links">Links Gerados</TabsTrigger>
          <TabsTrigger value="respostas">Respondentes</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Links de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => {
                    const isExpired =
                      link.data_expiracao && new Date(link.data_expiracao) < new Date()
                    const displayStatus = isExpired ? 'expirado' : link.status
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">
                          {link.expand?.cliente_id?.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {link.link_unico}
                        </TableCell>
                        <TableCell>
                          {link.quantidade_usada} / {link.quantidade_permitida}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              displayStatus === 'ativo'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.link_unico)}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copiar URL
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {links.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhum link criado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respostas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Respostas Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondente</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status Geral</TableHead>
                    <TableHead className="text-right">Relatório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {respostas.map((r) => {
                    const calc = calculos.find((c) => c.resposta_id === r.id)
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium">{r.nome_respondente}</p>
                          <p className="text-xs text-muted-foreground">{r.email_respondente}</p>
                        </TableCell>
                        <TableCell>{r.expand?.cliente_id?.name}</TableCell>
                        <TableCell className="capitalize">{r.grau_parentesco}</TableCell>
                        <TableCell>{new Date(r.created).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          {calc ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                calc.estado_sucessao === 'verde'
                                  ? 'bg-green-100 text-green-800'
                                  : calc.estado_sucessao === 'amarelo'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {calc.estado_sucessao.toUpperCase()}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/assessments/report/${r.id}`)}
                          >
                            <FileText className="w-4 h-4 mr-2" /> Ver PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {respostas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhuma resposta recebida.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidado" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Visão Consolidada</CardTitle>
                <CardDescription>Médias gerais da organização.</CardDescription>
              </div>
              <div className="w-64">
                <Select
                  value={selectedClientConsolidated}
                  onValueChange={setSelectedClientConsolidated}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Empresas</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {consolidatedData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-6">
                  <RadarChartComp data={consolidatedData} color="#4f46e5" />
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Ranking de Forças</h3>
                    {[...consolidatedData]
                      .sort((a, b) => b.value - a.value)
                      .map((d, i) => (
                        <div key={d.subject} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                            <span className="font-medium text-slate-700">{d.subject}</span>
                          </span>
                          <span className="font-bold">{d.value.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum dado suficiente para gerar o consolidado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <QuestionManager questions={questions} fetchQuestions={fetchQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
