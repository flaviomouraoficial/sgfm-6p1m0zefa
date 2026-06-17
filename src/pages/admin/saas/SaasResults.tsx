import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Eye, FileText, PieChart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() || ''
  switch (s) {
    case 'concluído':
    case 'concluido':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Concluído</Badge>
    case 'pendente':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Pendente
        </Badge>
      )
    case 'em_progresso':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Em Progresso
        </Badge>
      )
    case 'cancelado':
      return <Badge variant="destructive">Cancelado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function ResultViewer({ data, questions }: { data: any; questions: any[] }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">
        Nenhum dado de resultado estruturado encontrado.
      </p>
    )
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    return (
      <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto m-4 border border-border/50">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  const answers = data.answers || data.respostas || data
  const metadata = { ...data }
  delete metadata.answers
  delete metadata.respostas

  // Map answers using questions
  const groupedAnswers: Record<string, any[]> = {}

  if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([qId, val]) => {
      if (['respondentLevel', 'classification', 'scores', 'overall'].includes(qId)) return // Skip calculated fields
      const question = questions.find((q) => q.id === qId)
      const dimension = question?.dimension || 'Outros'
      const text = question?.text || qId

      if (!groupedAnswers[dimension]) groupedAnswers[dimension] = []
      groupedAnswers[dimension].push({ text, value: val })
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {Object.keys(metadata).length > 0 && (
        <Card className="shadow-sm border-primary/20">
          <CardHeader className="pb-2 bg-primary/5">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-primary">
              Metadados e Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 sm:grid-cols-2">
            {Object.entries(metadata).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key} className="col-span-full">
                    <span className="text-xs text-muted-foreground uppercase">{key}</span>
                    <pre className="text-xs bg-muted p-2 mt-1 rounded-md overflow-x-auto border border-border/50">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                )
              }
              return (
                <div key={key}>
                  <span className="text-xs text-muted-foreground uppercase">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm font-semibold">{String(value)}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedAnswers).map(([dimension, items]) => (
        <Card key={dimension} className="shadow-sm">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full inline-block"></span>
              {dimension}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm text-slate-600 font-medium leading-snug">{item.text}</p>
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 text-sm font-bold min-w-[2.5rem] shrink-0 border shadow-sm">
                    {String(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SaasResults() {
  const [results, setResults] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  useEffect(() => {
    fetchResults()
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const records = await pb.collection('v1_saas_questions').getFullList()
      setQuestions(records)
    } catch (err) {
      console.error('Failed to fetch questions', err)
    }
  }

  const fetchResults = async () => {
    try {
      const records = await pb.collection('v1_saas_results').getFullList({
        expand: 'client,diagnostic',
        sort: '-created',
      })
      setResults(records)
    } catch (error) {
      console.error('Failed to fetch results', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <PieChart className="w-8 h-8 text-primary" />
            Resultados de Diagnósticos
          </h2>
          <p className="text-slate-500 mt-1">
            Acompanhe os resultados e o consumo de créditos dos diagnósticos realizados.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Relatórios e Resultados
          </CardTitle>
          <CardDescription>
            Lista de todos os assessments enviados e respondidos através da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700">Diagnóstico</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Consumo</TableHead>
                  <TableHead className="font-semibold text-slate-700">Iniciado Em</TableHead>
                  <TableHead className="font-semibold text-slate-700">Concluído Em</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Carregando resultados...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow key={result.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        {result.expand?.client?.name ||
                          result.expand?.client?.email ||
                          'Sem Cliente'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {result.expand?.diagnostic?.title || 'Desconhecido'}
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono bg-white">
                          {result.credits_consumed || 0} cr
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {result.started_at
                          ? format(new Date(result.started_at), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {result.completed_at
                          ? format(new Date(result.completed_at), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => setSelectedResult(result)}
                          >
                            <Eye className="w-4 h-4 mr-1.5" /> Detalhes
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            onClick={async () => {
                              if (confirm('Deseja realmente excluir este resultado?')) {
                                try {
                                  await pb.collection('v1_saas_results').delete(result.id)
                                  setResults((prev) => prev.filter((r) => r.id !== result.id))
                                } catch (e) {
                                  console.error(e)
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/50">
          <DialogHeader className="px-6 py-4 bg-white border-b border-border shadow-sm">
            <DialogTitle className="text-xl flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Detalhes do Resultado
            </DialogTitle>
            <DialogDescription>
              Visualização estruturada dos dados retornados pelo diagnóstico de{' '}
              <span className="font-medium text-slate-900">
                {selectedResult?.expand?.client?.name || 'Cliente'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <ResultViewer data={selectedResult?.result_json} questions={questions} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
