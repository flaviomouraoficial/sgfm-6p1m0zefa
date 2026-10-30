import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { contratosService } from '@/services/contratos'
import { ContratoTreinamento } from '@/lib/contratos-types'
import { gerarContratoPDF } from '@/lib/contrato-pdf'
import { exportarContratoDocx } from '@/lib/contrato-docx'
import { useToast } from '@/hooks/use-toast'

interface PainelContratosListProps {
  onNovoContrato: () => void
}

export function PainelContratosList({ onNovoContrato }: PainelContratosListProps) {
  const { toast } = useToast()
  const [contratos, setContratos] = useState<ContratoTreinamento[]>([])
  const [loading, setLoading] = useState(false)

  const loadContratos = async () => {
    try {
      setLoading(true)
      const list = await contratosService.list()
      setContratos(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContratos()
  }, [])

  const handleBaixarPdfExistente = async (contrato: ContratoTreinamento) => {
    if (!contrato.snapshot_dados_contrato) {
      toast({
        title: 'Documento Antigo',
        description: 'Os dados do snapshot não estão disponíveis para este contrato.',
        variant: 'destructive',
      })
      return
    }
    try {
      const blob = await gerarContratoPDF(contrato.snapshot_dados_contrato)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${contrato.numero_contrato.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao renderizar PDF.',
        variant: 'destructive',
      })
    }
  }

  const handleBaixarDocxExistente = (contrato: ContratoTreinamento) => {
    if (!contrato.snapshot_dados_contrato) return
    const blob = exportarContratoDocx(contrato.snapshot_dados_contrato)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Contrato_${contrato.numero_contrato.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contratos Emitidos & Rascunhos
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de contratos de treinamento in company com status e alertas de pendências
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadContratos} className="h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
            </Button>
            <Button size="sm" onClick={onNovoContrato} className="h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo Contrato
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Número & Data</TableHead>
                <TableHead>Contratada</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status & Pendências</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : contratos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum contrato gerado ainda. Clique em "Novo Contrato" para iniciar.
                  </TableCell>
                </TableRow>
              ) : (
                contratos.map((c) => {
                  const empNome = c.expand?.empresa_id?.nome || 'Trend Consultoria'
                  const cliNome = c.expand?.cliente_id?.name || 'Cliente'

                  return (
                    <TableRow key={c.id} className="text-xs">
                      <TableCell>
                        <div className="font-semibold font-mono">{c.numero_contrato}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {c.created ? new Date(c.created).toLocaleDateString('pt-BR') : '—'}
                        </div>
                      </TableCell>
                      <TableCell>{empNome}</TableCell>
                      <TableCell className="font-medium">{cliNome}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        R${' '}
                        {c.valor_total
                          ? c.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '0,00'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {c.status === 'emitido' && (
                            <Badge className="bg-emerald-600 text-[10px]">Emitido</Badge>
                          )}
                          {c.status === 'pendente_participantes' && (
                            <Badge className="bg-amber-600 text-[10px] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Nomes Pendentes
                            </Badge>
                          )}
                          {c.status === 'rascunho' && (
                            <Badge variant="outline" className="text-slate-600 text-[10px]">
                              Rascunho
                            </Badge>
                          )}

                          {c.alerta_participantes_pendentes && (
                            <div className="text-[10px] text-amber-700 font-medium">
                              Participantes nominais a complementar por aditivo
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {c.snapshot_dados_contrato && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-primary"
                              onClick={() => handleBaixarPdfExistente(c)}
                              title="Baixar PDF A4"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-slate-700"
                              onClick={() => handleBaixarDocxExistente(c)}
                              title="Baixar DOCX"
                            >
                              DOCX
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
