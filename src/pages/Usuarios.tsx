import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usersService } from '@/services/users'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, ShieldCheck, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UserDialog } from '@/components/users/UserDialog'

type Profile = {
  id: string
  email: string
  role: string
  plan?: string
  created_at: string
}

export default function Usuarios() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const { toast } = useToast()

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setUsers(data as Profile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: Profile) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
      )
    )
      return

    try {
      await usersService.delete(id)
      toast({ title: 'Usuário excluído com sucesso!' })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleSaveUser = async (data: any) => {
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({ role: data.role, plan: data.plan })
          .eq('id', editingUser.id)

        if (error) throw error

        if (data.password) {
          await usersService.updatePassword(editingUser.id, data.password)
        }
        toast({ title: 'Usuário atualizado com sucesso!' })
      } else {
        // Create new user
        await usersService.create(data)
        toast({ title: 'Usuário criado com sucesso!' })
      }
      fetchUsers()
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      throw error
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os acessos, planos e perfis do seu sistema.
          </p>
        </div>
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <span className="truncate max-w-[150px]">{user.email.split('@')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {user.role === 'admin' ? 'Administrador' : 'Mentorado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize text-primary border-primary/20 bg-primary/5"
                      >
                        {user.plan || 'Básico'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Edit2 className="w-4 h-4 text-accent" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
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
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </div>
  )
}
