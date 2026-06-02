import { useState, useEffect } from 'react'
import { Plus, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { Recibo } from '@/lib/types'
import { useRealtime } from '@/hooks/use-realtime'
import { ReceiptForm } from './ReceiptForm'
import { ReceiptPrint } from './ReceiptPrint'
import { useToast } from '@/hooks/use-toast'

export default function RecibosPage() {
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [printingRecibo, setPrintingRecibo] = useState<Recibo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const fetchRecibos = async () => {
    try {
      const records = await pb.collection('v1_recibos').getFullList<Recibo>({ sort: '-created' })
      setRecibos(records)
    } catch (err) {
      toast({ title: 'Erro ao carregar recibos', variant: 'destructive' })
    }
  }

  useEffect(() => {
    fetchRecibos()
  }, [])
  useRealtime('v1_recibos', () => {
    fetchRecibos()
  })

  const handlePrint = (recibo: Recibo) => {
    setPrintingRecibo(recibo)
    setTimeout(() => {
      const originalTitle = document.title
      document.title = recibo.numero
      window.print()
      document.title = originalTitle
      setPrintingRecibo(null)
    }, 500)
  }

  const filteredRecibos = recibos.filter(
    (r) =>
      r.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recibos</h2>
          <p className="text-muted-foreground">
            Gerencie seus recibos de contas a pagar e receber.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Recibo
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
        <Input
          placeholder="Buscar por número ou cliente..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor NF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecibos.map((recibo) => (
              <TableRow key={recibo.id}>
                <TableCell className="font-medium">{recibo.numero}</TableCell>
                <TableCell>{format(new Date(recibo.data_criacao), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{recibo.cliente_nome}</TableCell>
                <TableCell>
                  <Badge variant={recibo.tipo === 'Receber' ? 'default' : 'secondary'}>
                    {recibo.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  {recibo.nf_valor_total
                    ? `R$ ${recibo.nf_valor_total.toFixed(2).replace('.', ',')}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{recibo.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handlePrint(recibo)}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRecibos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum recibo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ReceiptForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      {printingRecibo && <ReceiptPrint recibo={printingRecibo} />}
    </div>
  )
}
