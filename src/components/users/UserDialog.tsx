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
import { Switch } from '@/components/ui/switch'
import { extractFieldErrors, FieldErrors } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAccessHistory } from '@/components/users/UserAccessHistory'

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
  const [permissions, setPermissions] = useState({
    links: true,
    agenda: true,
    credits: true,
    reports: true,
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [accessProfiles, setAccessProfiles] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    pb.collection('v1_access_profiles')
      .getFullList()
      .then(setAccessProfiles)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setPassword('')
      setPasswordConfirm('')
      setRole(user.role || 'mentee')
      setPlan(user.plan || 'básico')
      setPermissions(
        (user as any).permissions || {
          links: true,
          agenda: true,
          credits: true,
          reports: true,
        },
      )
    } else {
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
      setRole('mentee')
      setPlan('básico')
      setPermissions({
        links: true,
        agenda: true,
        credits: true,
        reports: true,
      })
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

  const handleApplyProfile = (profileId: string) => {
    const prof = accessProfiles.find((p) => p.id === profileId)
    if (prof && prof.permissions) {
      setPermissions({
        links: !!prof.permissions.links,
        agenda: !!prof.permissions.agenda,
        credits: !!prof.permissions.credits,
        reports: !!prof.permissions.reports,
      })
      toast({
        title: 'Perfil aplicado',
        description: `As permissões de "${prof.name}" foram preenchidas.`,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          {user && (
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="history">Histórico de Acessos</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="data">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto px-1">
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
                      <SelectItem value="client">Cliente SaaS</SelectItem>
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

                {role !== 'admin' && (
                  <div className="space-y-4 pt-4 border-t mt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Permissões de Acesso</h4>
                      {accessProfiles.length > 0 && (
                        <div className="w-[180px]">
                          <Select onValueChange={handleApplyProfile}>
                            <SelectTrigger className="h-8 text-xs bg-muted/30">
                              <SelectValue placeholder="Aplicar Perfil..." />
                            </SelectTrigger>
                            <SelectContent>
                              {accessProfiles.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-muted/10 p-3 rounded-lg border">
                      <Label
                        htmlFor="perm-links"
                        className="flex flex-col space-y-1 cursor-pointer"
                      >
                        <span>Acesso a Links</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Permite visualizar e acessar links de assessments.
                        </span>
                      </Label>
                      <Switch
                        id="perm-links"
                        checked={permissions.links}
                        onCheckedChange={(checked) =>
                          setPermissions((p) => ({ ...p, links: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between bg-muted/10 p-3 rounded-lg border">
                      <Label
                        htmlFor="perm-agenda"
                        className="flex flex-col space-y-1 cursor-pointer"
                      >
                        <span>Acesso à Agenda</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Permite agendar sessões e ver horários.
                        </span>
                      </Label>
                      <Switch
                        id="perm-agenda"
                        checked={permissions.agenda}
                        onCheckedChange={(checked) =>
                          setPermissions((p) => ({ ...p, agenda: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between bg-muted/10 p-3 rounded-lg border">
                      <Label
                        htmlFor="perm-credits"
                        className="flex flex-col space-y-1 cursor-pointer"
                      >
                        <span>Compra de Créditos</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Permite acesso à loja e pacotes de créditos.
                        </span>
                      </Label>
                      <Switch
                        id="perm-credits"
                        checked={permissions.credits}
                        onCheckedChange={(checked) =>
                          setPermissions((p) => ({ ...p, credits: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between bg-muted/10 p-3 rounded-lg border">
                      <Label
                        htmlFor="perm-reports"
                        className="flex flex-col space-y-1 cursor-pointer"
                      >
                        <span>Relatórios Realizados</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Permite visualizar resultados de diagnósticos.
                        </span>
                      </Label>
                      <Switch
                        id="perm-reports"
                        checked={permissions.reports}
                        onCheckedChange={(checked) =>
                          setPermissions((p) => ({ ...p, reports: checked }))
                        }
                      />
                    </div>
                  </div>
                )}
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
