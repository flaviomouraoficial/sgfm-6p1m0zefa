import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { useMainStore } from '@/stores/main'
import { cn, formatCurrency } from '@/lib/utils'
import { Edit, Trash2, FileDown, FileText } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { ProposalForm } from '@/components/propostas/ProposalForm'
import {
  getDefaultFormData,
  proposalToFormData,
  formDataToPayload,
  type ProposalFormData,
} from '@/lib/proposal-defaults'
import { buildProposalPDFData, generateProposalPDF } from '@/lib/proposal-pdf'

export default function Propostas() {
  const { systemSettings, fetchProposals } = useMainStore()
  const [proposals, setProposals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState<ProposalFormData>(getDefaultFormData())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [props, clis] = await Promise.all([
        pb.collection('v1_proposals').getFullList({ expand: 'cliente_id', sort: '-created' }),
        pb.collection('v1_clientes').getFullList({ sort: 'name' }),
      ])
      setProposals(props)
      setClients(clis)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async () => {
    if (!formData.cliente_id || !formData.nome_evento) {
      toast({
        title: 'Validação',
        description: 'Cliente e Nome do Evento são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const payload = formDataToPayload(formData)
      if (editingId) {
        await pb.collection('v1_proposals').update(editingId, payload)
        toast({ title: 'Sucesso', description: 'Proposta atualizada.' })
      } else {
        await pb.collection('v1_proposals').create(payload)
        toast({ title: 'Sucesso', description: 'Proposta criada.' })
      }
      setFormData(getDefaultFormData())
      setEditingId(null)
      loadData()
      fetchProposals()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar proposta.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (p: any) => {
    setFormData(proposalToFormData(p))
    setEditingId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNew = () => {
    setFormData(getDefaultFormData())
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await pb.collection('v1_proposals').delete(deleteId)
      toast({ title: 'Excluída', description: 'Proposta removida.' })
      setDeleteId(null)
      loadData()
      fetchProposals()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const handlePDF = (data: ProposalFormData, clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    generateProposalPDF(buildProposalPDFData(data, client?.name || 'N/A', systemSettings.logo))
  }

  const handlePDFFromRecord = (p: any) => {
    const clientName = p.expand?.cliente_id?.name || 'N/A'
    generateProposalPDF(buildProposalPDFData(p, clientName, systemSettings.logo))
  }

  const statusClass = (s: string) =>
    cn(
      'text-xs font-medium border',
      s === 'aprovado' && 'bg-green-100 text-green-700 border-green-300',
      s === 'reprovado' && 'bg-red-100 text-red-700 border-red-300',
      s === 'em análise' && 'bg-yellow-100 text-yellow-700 border-yellow-300',
    )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent">Propostas Comerciais</h1>
          <p className="text-muted-foreground mt-1">Crie, gerencie e exporte propostas em PDF.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            {editingId ? 'Editar Proposta' : 'Nova Proposta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalForm
            formData={formData}
            setFormData={setFormData}
            clients={clients}
            editingId={editingId}
            isSaving={saving}
            onSave={handleSave}
            onNew={handleNew}
            onGeneratePDF={() => handlePDF(formData, formData.cliente_id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Propostas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma proposta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.expand?.cliente_id?.name || p.cliente_id || 'N/A'}
                    </TableCell>
                    <TableCell>{p.nome_evento || p.title || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {p.data_geracao ? new Date(p.data_geracao).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(p.valor_global ?? p.value ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusClass(p.status)}>
                        {p.status || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(p)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePDFFromRecord(p)}
                          title="Baixar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(p.id)}
                          title="Excluir"
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
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
