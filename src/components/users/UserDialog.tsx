import { useState, useEffect } from 'react'
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
    } else {
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
      setRole('mentee')
      setPlan('básico')
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
      await onSave({ email, password, passwordConfirm, role, plan })
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                placeholder="Confirme a senha"
              />
              {fieldErrors.passwordConfirm && (
                <span className="text-destructive text-xs">{fieldErrors.passwordConfirm}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentee">Mentorado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && (
                <span className="text-destructive text-xs">{fieldErrors.role}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plano de Funcionalidades</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="básico">Básico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.plan && (
                <span className="text-destructive text-xs">{fieldErrors.plan}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
