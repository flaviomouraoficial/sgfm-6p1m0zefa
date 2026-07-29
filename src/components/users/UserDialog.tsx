import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { extractFieldErrors, FieldErrors } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAccessHistory } from '@/components/users/UserAccessHistory'
import { PermissionsEditor } from '@/components/users/PermissionsEditor'
import { getDefaultPermissions } from '@/lib/permissions'
import { ScrollArea } from '@/components/ui/scroll-area'

type Profile = { id: string; email: string; role: string; plan?: string }

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Profile | null
  onSave: (data: any) => Promise<void>
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [role, setRole] = useState('mentee')
  const [plan, setPlan] = useState('básico')
  const [permissions, setPermissions] = useState<Record<string, any>>(getDefaultPermissions())
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setPassword('')
      setPasswordConfirm('')
      setRole(user.role || 'mentee')
      setPlan(user.plan || 'básico')
      setPermissions((user as any).permissions || getDefaultPermissions())
    } else {
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
      setRole('mentee')
      setPlan('básico')
      setPermissions(getDefaultPermissions())
    }
    setFieldErrors({})
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    if (password !== passwordConfirm) {
      setFieldErrors({ passwordConfirm: 'As senhas não coincidem' })
      setLoading(false)
      return
    }

    try {
      await onSave({ email, password, passwordConfirm, role, plan, permissions })
      onOpenChange(false)
    } catch (error: any) {
      const errors = extractFieldErrors(error)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
      } else {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="data" className="w-full">
          {user && (
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="perms">Permissões</TabsTrigger>
              <TabsTrigger value="history">Acessos</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="data">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-2 max-h-[55vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {fieldErrors.email && (
                    <span className="text-destructive text-xs">{fieldErrors.email}</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{user ? 'Nova Senha (opcional)' : 'Senha'}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!user}
                    placeholder={user ? 'Deixe em branco para não alterar' : 'Digite a senha'}
                  />
                  {fieldErrors.password && (
                    <span className="text-destructive text-xs">{fieldErrors.password}</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
                  <Input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required={!user || password.length > 0}
                  />
                  {fieldErrors.passwordConfirm && (
                    <span className="text-destructive text-xs">{fieldErrors.passwordConfirm}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nível de Acesso</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mentee">Mentorado</SelectItem>
                        <SelectItem value="client">Cliente SaaS</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Plano</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="básico">Básico</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          {user && (
            <TabsContent value="perms">
              <ScrollArea className="h-[55vh] pr-4">
                <PermissionsEditor
                  permissions={permissions}
                  onChange={setPermissions}
                  isAdmin={role === 'admin'}
                />
              </ScrollArea>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </TabsContent>
          )}
          {user && (
            <TabsContent value="history">
              <div className="py-2 min-h-[300px]">
                <UserAccessHistory userId={user.id} />
              </div>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
