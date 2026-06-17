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
import { Eye, FileText, PieChart } from 'lucide-react'
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

function ResultViewer({ data }: { data: any }) {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 p-4">
      {Object.entries(data).map(([key, value]) => (
        <Card key={key} className="shadow-sm">
          <CardHeader className="pb-2 bg-muted/30">
            <CardTitle className="text-sm font-medium capitalize text-muted-foreground">
              {key.replace(/_/g, ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {typeof value === 'object' && value !== null ? (
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto border border-border/50">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span className="text-base font-semibold">{String(value)}</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SaasResults() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<any>(null)

  useEffect(() => {
    fetchResults()
  }, [])

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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="w-4 h-4 mr-1.5" /> Detalhes
                        </Button>
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
            <ResultViewer data={selectedResult?.result_json} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
