import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud, Download } from 'lucide-react'
import { parseCSVContent } from '@/lib/importUtils'
import { writeXlsx, parseXlsx } from '@/lib/xlsx'
import { TransactionType } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  type: TransactionType
  onUpload: (headers: string[], rows: any[][]) => void
  onBack: () => void
}

export function ImportUploadStep({ type, onUpload, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.xlsx')) {
      try {
        const { headers, rows } = await parseXlsx(file)
        onUpload(headers, rows)
      } catch (err) {
        console.error(err)
        toast({
          title: 'Erro de leitura',
          description: 'Não foi possível ler o arquivo XLSX. Verifique se não está corrompido.',
          variant: 'destructive',
        })
      }
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const text = evt.target?.result as string
        const { headers, rows } = parseCSVContent(text)
        onUpload(headers, rows)
      }
      reader.readAsText(file)
    } else {
      toast({
        title: 'Formato não suportado',
        description: 'Por favor, envie um arquivo .csv ou .xlsx.',
        variant: 'destructive',
      })
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    let headers: string[] = []
    let rows: string[][] = []

    if (type === 'Despesa') {
      headers = [
        'Fornecedor',
        'Valor',
        'Data Lançamento',
        'Data Vencimento',
        'Categoria',
        'Status',
        'Descrição',
        'Pagamento',
      ]
      rows = [
        [
          'Empresa Alpha',
          'R$ 1.500,50',
          '20/03/2026',
          '25/03/2026',
          'Software',
          'Pago',
          'Assinatura anual',
          'PIX',
        ],
        [
          'Empresa Beta',
          '800,00',
          '05/04/2026',
          '10/04/2026',
          'Marketing',
          'Pendente',
          'Campanha de anúncios',
          'Boleto',
        ],
      ]
    } else {
      headers = [
        'Cliente',
        'Valor',
        'Data Lançamento',
        'Data Vencimento',
        'Serviço',
        'Status',
        'Descrição',
        'Pagamento',
      ]
      rows = [
        [
          'Empresa Gamma',
          'R$ 3.500,00',
          '20/03/2026',
          '25/03/2026',
          'Consultoria',
          'Pago',
          'Consultoria em Vendas',
          'PIX',
        ],
        [
          'João Silva',
          '1.250,50',
          '05/04/2026',
          '10/04/2026',
          'Mentoria',
          'Pendente',
          'Mentoria Individual',
          'Boleto',
        ],
      ]
    }

    const templateData = [headers, ...rows]
    const blob = writeXlsx(templateData)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `template_importacao_${type.toLowerCase()}.xlsx`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadValidSample = () => {
    let headers: string[] = []
    let rows: string[][] = []

    if (type === 'Despesa') {
      headers = [
        'Fornecedor',
        'Valor',
        'Data Lançamento',
        'Data Vencimento',
        'Categoria',
        'Status',
        'Descrição',
        'Pagamento',
      ]
      rows = [
        [
          'Empresa Alpha',
          'R$ 1.500,50',
          '20/03/2026',
          '25/03/2026',
          'Software',
          'Pago',
          'Assinatura anual',
          'PIX',
        ],
        [
          'Empresa Beta',
          '800,00',
          '05/04/2026',
          '10/04/2026',
          'Marketing',
          'Pendente',
          'Campanha de anúncios',
          'Boleto',
        ],
      ]
    } else {
      headers = [
        'Cliente',
        'Valor',
        'Data Lançamento',
        'Data Vencimento',
        'Serviço',
        'Status',
        'Descrição',
        'Pagamento',
      ]
      rows = [
        [
          'Empresa Gamma',
          'R$ 3.500,00',
          '20/03/2026',
          '25/03/2026',
          'Consultoria',
          'Pago',
          'Consultoria em Vendas',
          'PIX',
        ],
        [
          'João Silva',
          '1.250,50',
          '05/04/2026',
          '10/04/2026',
          'Mentoria',
          'Pendente',
          'Mentoria Individual',
          'Boleto',
        ],
      ]
    }
    onUpload(headers, rows)
  }

  const loadErrorSample = () => {
    const headers = [
      'Fornecedor',
      'Valor',
      'Data Lançamento',
      'Data Vencimento',
      'Categoria',
      'Descrição',
      'Pagamento',
    ]
    const rows = [
      [
        'Empresa Valida',
        'R$ 1.000,00',
        '15/03/2026',
        '20/03/2026',
        'Consultoria',
        'Linha Válida',
        'PIX',
      ],
      ['  ', 'R$ 15.000,50', '15/03/2026', '20/03/2026', 'Consultoria', '', 'PIX'],
      ['', 'abc', 'inv', 'invalida', '', 'Erro Teste', ''],
    ]
    onUpload(headers, rows)
  }

  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Selecione um arquivo .xlsx ou .csv</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          A primeira linha do arquivo será considerada o cabeçalho.
        </p>
        <Input
          type="file"
          accept=".csv, .xlsx"
          className="hidden"
          ref={fileRef}
          onChange={handleFile}
        />
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
            Buscar Arquivo
          </Button>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto gap-2 text-green-600 border-green-600/30 hover:bg-green-600/10 hover:text-green-700"
          >
            <Download className="w-4 h-4" />
            Baixar Template (.xlsx)
          </Button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 border-t pt-6 w-full max-w-sm">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            Dados de Teste
          </span>
          <div className="flex gap-4">
            <Button variant="link" size="sm" onClick={loadValidSample}>
              Usar dados válidos
            </Button>
            <Button variant="link" size="sm" className="text-destructive" onClick={loadErrorSample}>
              Testar Erros
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
