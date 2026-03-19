import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { exportToCSV } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2,
  User,
  Phone,
  Mail,
  Gift,
  Download,
  Printer,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Client } from '@/lib/types'

export default function Clientes() {
  const { clients, updateClient, removeClient } = useMainStore()

  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (clientToEdit) {
      updateClient(clientToEdit.id, clientToEdit)
      toast({ title: 'Cliente Atualizado', description: 'Os dados foram salvos com sucesso.' })
      setClientToEdit(null)
    }
  }

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      removeClient(clientToDelete.id)
      toast({ title: 'Cliente Removido', description: 'O cliente foi excluído.' })
      setClientToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Cadastro de Clientes</h1>
        <div className="flex items-center space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV('clientes.csv', clients)}
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <Card
            key={client.id}
            className="shadow-sm hover:shadow-md transition-shadow relative group"
          >
            <div className="absolute right-2 top-2 print:hidden z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setClientToEdit(client)}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setClientToDelete(client)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-start pr-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {client.isB2B ? (
                      <Building2 className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base truncate max-w-[160px]">
                      {client.name}
                    </CardTitle>
                    {client.companyName && client.companyName !== client.name && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate max-w-[160px]">
                        {client.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-medium bg-muted/20 shrink-0">
                  {client.isB2B ? 'PJ' : 'PF'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2.5 text-xs">
                {client.phone && (
                  <div className="flex items-center justify-between group/link">
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 mr-2" />
                      {client.phone}
                    </div>
                    <a
                      href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 hover:text-green-700 opacity-0 group-hover/link:opacity-100 transition-opacity font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center justify-between group/link">
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 mr-2" />
                      <span className="truncate max-w-[140px]">{client.email}</span>
                    </div>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary hover:text-primary/80 opacity-0 group-hover/link:opacity-100 transition-opacity font-medium flex items-center bg-primary/5 px-1.5 py-0.5 rounded shrink-0"
                    >
                      Enviar
                    </a>
                  </div>
                )}
                {client.birthday && (
                  <div className="flex items-center text-accent font-medium mt-1 pt-1">
                    <Gift className="w-3.5 h-3.5 mr-2" />
                    Nascimento:{' '}
                    {new Date(client.birthday).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
                {client.notes && (
                  <div className="mt-2 text-muted-foreground bg-muted/30 p-2 rounded-md italic border">
                    {client.notes}
                  </div>
                )}
              </div>

              {client.isB2B && client.contacts && client.contacts.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    Contatos Vinculados
                  </h4>
                  <div className="space-y-2">
                    {client.contacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col text-xs bg-muted/20 p-2 rounded border border-border/30"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-foreground/90">{contact.name}</span>
                          <span className="text-[10px] bg-background px-1.5 rounded text-muted-foreground border">
                            {contact.role}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-muted-foreground hover:text-primary truncate max-w-[120px]"
                          >
                            {contact.email}
                          </a>
                          <a
                            href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:text-green-700 ml-2"
                            title="WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!clientToEdit} onOpenChange={(open) => !open && setClientToEdit(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-screen">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {clientToEdit && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome / Razão Social</Label>
                <Input
                  id="name"
                  value={clientToEdit.name}
                  onChange={(e) => setClientToEdit({ ...clientToEdit, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  value={clientToEdit.phone}
                  onChange={(e) => setClientToEdit({ ...clientToEdit, phone: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail Principal</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientToEdit.email}
                  onChange={(e) => setClientToEdit({ ...clientToEdit, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Anotações / Observações</Label>
                <Textarea
                  id="notes"
                  value={clientToEdit.notes || ''}
                  onChange={(e) => setClientToEdit({ ...clientToEdit, notes: e.target.value })}
                  className="resize-none h-20"
                />
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setClientToEdit(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.name}</strong>? Esta
              ação não pode ser desfeita e removerá todo o histórico vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
