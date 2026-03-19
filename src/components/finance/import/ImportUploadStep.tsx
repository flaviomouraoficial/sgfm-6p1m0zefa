import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud, Download } from 'lucide-react'
import { parseCSVContent } from '@/lib/importUtils'
import { exportToCSV } from '@/lib/utils'
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.xlsx')) {
      toast({
        title: 'Formato não suportado',
        description: 'Por favor, salve sua planilha como .csv antes de enviar.',
        variant: 'destructive',
      })
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const { headers, rows } = parseCSVContent(text)
      onUpload(headers, rows)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const entity = type === 'Receita' ? 'Cliente' : 'Fornecedor'
    const cat = type === 'Receita' ? 'Serviço' : 'Categoria'

    const templateData = [
      {
        'Data de Vencimento': '25/03/2026',
        Descrição: 'Exemplo de transação 1',
        Valor: 'R$ 1.500,50',
        [entity]: 'Empresa Alpha',
        [cat]: type === 'Receita' ? 'Consultoria' : 'Software',
        Pagamento: 'PIX',
      },
      {
        'Data de Vencimento': '10/04/2026',
        Descrição: 'Exemplo de transação 2',
        Valor: '800,00',
        [entity]: 'Empresa Beta',
        [cat]: type === 'Receita' ? 'Mentoria' : 'Marketing',
        Pagamento: 'Boleto',
      },
      {
        'Data de Vencimento': '15/05/2026',
        Descrição: 'Exemplo de transação 3',
        Valor: '125,75',
        [entity]: 'Empresa Gamma',
        [cat]: type === 'Receita' ? 'Assessoria' : 'Infraestrutura',
        Pagamento: 'Cartão de Crédito',
      },
    ]
    exportToCSV(`template_importacao_${type.toLowerCase()}.csv`, templateData)
  }

  const loadValidSample = () => {
    const entity = type === 'Receita' ? 'Cliente' : 'Fornecedor'
    const cat = type === 'Receita' ? 'Serviço' : 'Categoria'
    const sample = `Data de Vencimento;Descrição;Valor;${entity};${cat};Pagamento\n20/03/2026;Consultoria Estratégica;R$ 15.000,50;Beta Corp;Consultoria;PIX\n10/05/2026;Pagamento de Software;1.500,50;Tech Solutions;Software;Cartão de Crédito\n2026-06-01;Material de Escritório;250,00;Papelaria Central;Materiais;Boleto\n`
    const { headers, rows } = parseCSVContent(sample)
    onUpload(headers, rows)
  }

  const loadErrorSample = () => {
    const entity = type === 'Receita' ? 'Cliente' : 'Fornecedor'
    const cat = type === 'Receita' ? 'Serviço' : 'Categoria'
    const sample = `Data de Vencimento;Descrição;Valor;${entity};${cat};Pagamento\n20/03/2026;Linha Válida;R$ 1.000,00;Valid Corp;Consultoria;PIX\n20/03/2026;;R$ 15.000,50;  ;Consultoria;PIX\ninvalida;Erro Teste;abc;;;\n`
    const { headers, rows } = parseCSVContent(sample)
    onUpload(headers, rows)
  }

  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Selecione um arquivo .csv</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Certifique-se de que a primeira linha contém os cabeçalhos das colunas.
        </p>
        <Input type="file" accept=".csv" className="hidden" ref={fileRef} onChange={handleFile} />
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
            Buscar Arquivo
          </Button>
          <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto gap-2">
            <Download className="w-4 h-4" />
            Baixar Template de Importação
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
