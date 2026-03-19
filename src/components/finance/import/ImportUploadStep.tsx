import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UploadCloud } from 'lucide-react'
import { parseCSVContent } from '@/lib/importUtils'

interface Props {
  onUpload: (headers: string[], rows: any[][]) => void
  onBack: () => void
}

export function ImportUploadStep({ onUpload, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.xlsx')) {
      const mockH = ['Data', 'Descrição', 'Valor', 'Entidade', 'Categoria', 'Pagamento']
      const mockR = [
        ['2026-05-10', 'Consultoria Empresa', '5000', 'Tech Solutions', 'Consultoria', 'PIX'],
        ['invalida', 'Erro de formato mock', 'abc', '', '', ''],
      ]
      onUpload(mockH, mockR)
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

  const loadSample = () => {
    const sample = `Data;Descrição;Valor;ClienteFornecedor;Categoria;Pagamento\n20/03/2026;Consultoria Estratégica;15000;Beta Corp;Consultoria;PIX\nInvalid Date;Erro Teste;abc;;;\n`
    const { headers, rows } = parseCSVContent(sample)
    onUpload(headers, rows)
  }

  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
        <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Selecione um arquivo .csv ou .xlsx</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Certifique-se de que a primeira linha contém os cabeçalhos das colunas.
        </p>
        <Input
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          ref={fileRef}
          onChange={handleFile}
        />
        <Button onClick={() => fileRef.current?.click()}>Buscar Arquivo</Button>
        <Button variant="link" size="sm" className="mt-4" onClick={loadSample}>
          Usar dados de exemplo (Mock)
        </Button>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
