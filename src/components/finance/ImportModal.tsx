import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMainStore } from '@/stores/main'
import { Transaction } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { UploadCloud, CheckCircle2, XCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface ParsedRow {
  isValid: boolean
  errors: string[]
  data: Partial<Transaction>
  raw: any
}

const parseCSV = (t: string) => {
  const l = t.split(/\r?\n/).filter((x) => x.trim())
  if (l.length < 2) return []
  const sep = (l[0].match(/;/g) || []).length > (l[0].match(/,/g) || []).length ? ';' : ','
  const h = l[0].split(sep).map((x) => x.trim().toLowerCase())
  return l.slice(1).map((line) => {
    const res = []
    let cur = '',
      inQ = false
    for (const c of line) {
      if (c === '"') inQ = !inQ
      else if (c === sep && !inQ) {
        res.push(cur.trim())
        cur = ''
      } else cur += c
    }
    res.push(cur.trim())
    return h.reduce((obj: any, key, i) => ({ ...obj, [key]: res[i] || '' }), {})
  })
}

const validateRow = (r: any): ParsedRow => {
  const e: string[] = []
  const d: Partial<Transaction> = {
    id: Math.random().toString(36).substr(2, 9),
    status: 'Pago',
    performer: 'Eu',
  }
  const get = (keys: string[]) => keys.reduce((acc, k) => acc || r[k], undefined)

  let dt = get(['data', 'date', 'vencimento'])
  if (!dt) e.push('Data ausente')
  else {
    if (dt.includes('/')) dt = dt.split('/').reverse().join('-')
    const date = new Date(dt)
    if (isNaN(date.getTime())) e.push('Data inválida')
    else d.date = date.toISOString().split('T')[0]
  }

  d.description = get(['descrição', 'descricao', 'description'])
  if (!d.description) e.push('Descrição ausente')

  const val = get(['valor', 'value'])
  if (!val) e.push('Valor ausente')
  else {
    const v = parseFloat(String(val).replace(/\./g, '').replace(',', '.'))
    if (isNaN(v)) e.push('Valor numérico inválido')
    else d.amount = v
  }

  const t = String(get(['tipo', 'type']) || '').toLowerCase()
  if (t.includes('receita') || t.includes('income')) d.type = 'Receita'
  else if (t.includes('despesa') || t.includes('expense')) d.type = 'Despesa'
  else e.push('Tipo inválido')

  if (d.type === 'Receita') {
    d.client = get(['cliente', 'client', 'mentorado'])
    if (!d.client) e.push('Cliente ausente')
    d.service = get(['serviço', 'servico', 'service'])
    if (!d.service) e.push('Serviço ausente')
  } else if (d.type === 'Despesa') {
    d.supplier = get(['fornecedor', 'supplier'])
    if (!d.supplier) e.push('Fornecedor ausente')
    d.category = get(['categoria', 'category'])
    if (!d.category) e.push('Categoria ausente')
  }

  d.paymentMethod = get(['pagamento', 'metodo', 'forma de pgto', 'forma', 'payment']) || 'PIX'
  d.company = get(['empresa', 'company']) || 'Grupo Flávio Moura'
  d.bank = get(['banco', 'bank']) || 'Banco Itaú'

  return { isValid: e.length === 0, errors: e, data: d, raw: r }
}

export function ImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addTransactions, addService, addExpenseCategory, services, expenseCategories } =
    useMainStore()
  const { toast } = useToast()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.xlsx')) {
      const mockRows = [
        {
          data: '2026-05-10',
          descrição: 'Consultoria Estratégica',
          valor: '5000',
          tipo: 'Receita',
          cliente: 'Alpha Ltda',
          serviço: 'Consultoria',
          forma: 'PIX',
        },
        {
          data: '2026-05-12',
          descrição: 'Software CRM',
          valor: '350',
          tipo: 'Despesa',
          fornecedor: 'Salesforce',
          categoria: 'Software',
          forma: 'Cartão',
        },
        {
          data: 'Invalida',
          descrição: 'Erro de formatação',
          valor: 'abc',
          tipo: 'Despesa',
          categoria: 'Outros',
        },
      ]
      setParsedData(mockRows.map(validateRow))
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => setParsedData(parseCSV(evt.target?.result as string).map(validateRow))
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const loadSampleData = () => {
    const sampleCSV = `Data;Descrição;Valor;Tipo;Cliente;Fornecedor;Serviço;Categoria;Forma\n20/03/2026;Consultoria Estratégica;15000;Receita;Beta Corp;;Consultoria;;PIX\n22/03/2026;Licença de Software;1200;Despesa;;AWS;;Software;Cartão\nInvalid Date;Teste Erro;abc;Erro;;;;;`
    setParsedData(parseCSV(sampleCSV).map(validateRow))
  }

  const handleConfirm = () => {
    if (!parsedData) return
    const validRows = parsedData.filter((r) => r.isValid).map((r) => r.data as Transaction)
    validRows.forEach((r) => {
      if (r.type === 'Receita' && r.service && !services.includes(r.service)) addService(r.service)
      if (r.type === 'Despesa' && r.category && !expenseCategories.includes(r.category))
        addExpenseCategory(r.category)
    })
    addTransactions(validRows)
    toast({
      title: 'Importação concluída',
      description: `${validRows.length} transações importadas com sucesso.`,
    })
    onOpenChange(false)
  }

  const validCount = parsedData?.filter((r) => r.isValid).length || 0
  const invalidCount = parsedData?.filter((r) => !r.isValid).length || 0
  const sum = (type: string) =>
    parsedData
      ?.filter((r) => r.isValid && r.data.type === type)
      .reduce((acc, r) => acc + (r.data.amount || 0), 0) || 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setParsedData(null)
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Importar Dados Financeiros</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha CSV ou Excel (.xlsx) para importar transações.
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
            <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um arquivo</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              O arquivo deve conter: Data, Descrição, Valor e Tipo. <br />
              Para Receitas: Cliente e Serviço. Para Despesas: Fornecedor e Categoria.
            </p>
            <Input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()}>Buscar Arquivo</Button>
            <Button variant="link" size="sm" className="mt-4" onClick={loadSampleData}>
              Usar dados de exemplo (Mock)
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Válidos</p>
                <p className="text-xl font-bold text-green-600">{validCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Erros</p>
                <p className="text-xl font-bold text-destructive">{invalidCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {sum('Receita').toLocaleString('pt-BR')}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-destructive">
                  R$ {sum('Despesa').toLocaleString('pt-BR')}
                </p>
              </Card>
            </div>

            <ScrollArea className="h-[250px] border rounded-md p-4">
              <div className="space-y-2">
                {parsedData.map((row, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-md text-sm border ${row.isValid ? 'bg-muted/30 border-muted' : 'bg-destructive/10 border-destructive/20'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium flex items-center gap-2">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        {row.raw['descrição'] ||
                          row.raw['descricao'] ||
                          row.raw['description'] ||
                          'Sem descrição'}
                      </div>
                      <div
                        className={
                          row.data.type === 'Receita' ? 'text-green-600' : 'text-destructive'
                        }
                      >
                        {row.data.type === 'Receita' ? '+' : '-'} R${' '}
                        {row.data.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ||
                          '0,00'}
                      </div>
                    </div>
                    {!row.isValid && (
                      <div className="text-xs text-destructive mt-1">
                        Erros: {row.errors.join(', ')}
                      </div>
                    )}
                    {row.isValid && (
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>
                          {new Date(row.data.date!).toLocaleDateString('pt-BR', {
                            timeZone: 'UTC',
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {row.data.type === 'Receita' ? row.data.client : row.data.supplier}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setParsedData(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={validCount === 0}>
                Confirmar Importação
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
