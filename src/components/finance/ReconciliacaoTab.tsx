import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { useFinanceStore } from '@/stores/finance'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, PlusCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

async function parseFile(file: File) {
  const text = await file.text()
  if (file.name.endsWith('.csv')) return parseCSV(text)
  if (file.name.endsWith('.ofx')) return parseOFX(text)
  return parseGenericText(text) // Best effort for PDFs read as plain text
}

function parseCSV(text: string) {
  const lines = text.split('\n')
  const txs = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length >= 3) {
      const date = cols[0].trim()
      const desc = cols[1].trim()
      const amt = parseFloat(cols[2].trim())
      if (!isNaN(amt)) {
        txs.push({
          id: Math.random().toString(),
          date: date.includes('/') ? date.split('/').reverse().join('-') : date,
          amount: Math.abs(amt),
          type: amt >= 0 ? 'Receita' : 'Despesa',
          description: desc,
        })
      }
    }
  }
  return txs
}

function parseOFX(text: string) {
  const txs = []
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match
  while ((match = stmtTrnRegex.exec(text)) !== null) {
    const trn = match[1]
    const dtMatch = trn.match(/<DTPOSTED>(.*?)(?:<|\r|\n)/)
    const amtMatch = trn.match(/<TRNAMT>(.*?)(?:<|\r|\n)/)
    const memoMatch = trn.match(/<MEMO>(.*?)(?:<|\r|\n)/)

    if (dtMatch && amtMatch) {
      const amount = parseFloat(amtMatch[1])
      const dateStr = dtMatch[1].substring(0, 8)
      const date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
      txs.push({
        id: Math.random().toString(),
        date,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'Receita' : 'Despesa',
        description: memoMatch ? memoMatch[1] : 'Transação',
      })
    }
  }
  return txs
}

function parseGenericText(text: string) {
  const txs = []
  const regex = /(\d{2}\/\d{2}\/\d{2,4}).*?(?:R\$)?\s*(-?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2}))/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const dateStr = match[1]
    const amtStr = match[2].replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const amount = parseFloat(amtStr)
    if (!isNaN(amount)) {
      const [d, m, y] = dateStr.split('/')
      const year = y.length === 2 ? `20${y}` : y
      txs.push({
        id: Math.random().toString(),
        date: `${year}-${m}-${d}`,
        amount: Math.abs(amount),
        type: amount >= 0 ? 'Receita' : 'Despesa',
        description: 'Lançamento via Extrato',
      })
    }
  }
  return txs
}

export function ReconciliacaoTab() {
  const { transactions, updateTransaction } = useMainStore()
  const { contas } = useFinanceStore()
  const [contaId, setContaId] = useState('')
  const [matches, setMatches] = useState<any[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!contaId) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma conta primeiro',
        variant: 'destructive',
      })
      return
    }
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const stx = await parseFile(file)
      const sysTxs = transactions.filter((t) => t.conta_id === contaId && !t.conciliado)

      const results = stx.map((s) => {
        const exact = sysTxs.find(
          (t) => t.amount === s.amount && t.date.startsWith(s.date) && t.type === s.type,
        )
        if (exact) return { stmtTx: s, matchType: 'EXACT', systemTx: exact }

        const partial = sysTxs.find((t) => t.amount === s.amount && t.type === s.type)
        if (partial) return { stmtTx: s, matchType: 'PARTIAL', systemTx: partial }

        return { stmtTx: s, matchType: 'NONE' }
      })
      setMatches(results)
      toast({
        title: 'Sucesso',
        description: `Arquivo processado: ${stx.length} lançamentos encontrados.`,
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao processar arquivo.', variant: 'destructive' })
    }
  }

  const confirmMatch = async (match: any, index: number) => {
    try {
      await updateTransaction(match.systemTx.id, { conciliado: true })
      setMatches((prev) => prev.filter((_, i) => i !== index))
      toast({ title: 'Sucesso', description: 'Transação conciliada.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao conciliar.', variant: 'destructive' })
    }
  }

  const quickCreate = async (match: any, index: number) => {
    try {
      await pb.collection('v1_transactions').create({
        description: match.stmtTx.description,
        amount: match.stmtTx.amount,
        type: match.stmtTx.type,
        date: match.stmtTx.date + 'T12:00:00.000Z',
        conta_id: contaId,
        status: 'Pago',
        conciliado: true,
        category: 'Outros',
      })
      setMatches((prev) => prev.filter((_, i) => i !== index))
      toast({ title: 'Sucesso', description: 'Transação criada e conciliada.' })
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao criar transação.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar Extrato Bancário</CardTitle>
          <CardDescription>Formatos suportados: .ofx, .csv, .pdf</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 w-full sm:w-64">
              <label className="text-sm font-medium">Conta Financeira</label>
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto flex-1">
              <label className="text-sm font-medium block mb-2">Arquivo de Extrato</label>
              <Input
                type="file"
                accept=".csv,.ofx,.pdf"
                onChange={handleFileUpload}
                disabled={!contaId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição (Banco)</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>{m.stmtTx.date}</TableCell>
                    <TableCell className="max-w-[250px] truncate" title={m.stmtTx.description}>
                      {m.stmtTx.description}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${m.stmtTx.type === 'Receita' ? 'text-primary' : 'text-destructive'}`}
                    >
                      {formatCurrency(m.stmtTx.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.matchType === 'EXACT' && <Badge className="bg-green-500">Exato</Badge>}
                      {m.matchType === 'PARTIAL' && (
                        <Badge variant="secondary" className="bg-yellow-500 text-white">
                          Parcial
                        </Badge>
                      )}
                      {m.matchType === 'NONE' && (
                        <Badge variant="destructive">Não Encontrado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {m.matchType !== 'NONE' ? (
                        <Button size="sm" onClick={() => confirmMatch(m, i)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => quickCreate(m, i)}>
                          <PlusCircle className="w-4 h-4 mr-1" /> Criar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
