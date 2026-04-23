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

type Profile = { id: string; email: string; role: string; plan?: string }

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Profile | null
  onSave: (data: any) => Promise<void>
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Skip@Pass123')
  const [role, setRole] = useState('mentee')
  const [plan, setPlan] = useState('básico')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setPassword('')
      setRole(user.role)
      setPlan(user.plan || 'básico')
    } else {
      setEmail('')
      setPassword('Skip@Pass123')
      setRole('mentee')
      setPlan('básico')
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ email, password, role, plan })
      onOpenChange(false)
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
                disabled={!!user}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{user ? 'Nova Senha (opcional)' : 'Senha Padrão'}</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!user}
                placeholder={user ? 'Deixe em branco para não alterar' : ''}
              />
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
