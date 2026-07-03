import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import { ContaFinanceira } from '@/lib/types'
import { toast } from '@/hooks/use-toast'

interface Props {
  contas: ContaFinanceira[]
  contaId: string
  onContaChange: (id: string) => void
  onFile: (file: File) => void
}

export function StatementUploadStep({ contas, contaId, onContaChange, onFile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!contaId) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma conta financeira primeiro.',
        variant: 'destructive',
      })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx') {
      toast({
        title: 'Formato inválido',
        description: 'Apenas arquivos .xlsx (Excel) são suportados para conciliação.',
        variant: 'destructive',
      })
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    onFile(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Extrato Bancário (XLSX)</CardTitle>
        <CardDescription>
          Selecione a conta financeira e faça upload do extrato em formato Excel (.xlsx). O arquivo
          deve conter as colunas: Data, Histórico/Descrição e Crédito/Débito (ou uma coluna de Valor
          único).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 max-w-sm">
          <Label>Conta Financeira</Label>
          <Select value={contaId} onValueChange={onContaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {contas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome} ({c.tipo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Selecionar arquivo Excel (.xlsx)</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Apenas arquivos .xlsx são aceitos. A primeira linha deve conter os cabeçalhos das
            colunas.
          </p>
          <Input
            type="file"
            accept=".xlsx"
            className="hidden"
            ref={fileRef}
            onChange={handleFile}
          />
          <Button variant="outline" className="gap-2">
            <UploadCloud className="w-4 h-4" /> Escolher Arquivo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
