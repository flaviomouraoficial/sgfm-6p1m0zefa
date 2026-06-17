import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coins, ArrowRight, XCircle, Link as LinkIcon, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [balance, setBalance] = useState(user?.balance || 0)
  const [results, setResults] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 360 Links State
  const [active360Id, setActive360Id] = useState<string | null>(null)
  const [links360, setLinks360] = useState<any[]>([])
  const [quotas, setQuotas] = useState({ estrategico: 5, tatico: 10, operacional: 20 })
  const [loadingLinks, setLoadingLinks] = useState(false)

  useEffect(() => {
    if (balance >= 0 && balance < 5) {
      toast({
        title: 'Atenção: Saldo Baixo',
        description: `Seu saldo atual é de ${balance} créditos. Adquira mais na Loja.`,
        className: 'bg-[#ef4444] text-white border-none',
      })
    }
  }, [balance, toast])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await pb.collection('users').getOne(user.id)
        setBalance(u.balance || 0)

        const res = await pb.collection('v1_saas_results').getFullList({
          filter: `client = "${user.id}"`,
          sort: '-created',
          expand: 'diagnostic',
        })
        setResults(res)

        const diags = await pb.collection('v1_saas_diagnostics').getFullList({
          sort: 'title',
        })
        setDiagnostics(diags)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.id])

  const handleStart = async (diag: any) => {
    if (balance < diag.cost) {
      toast({
        title: 'Saldo Insuficiente',
        description: 'Você não tem créditos suficientes para iniciar este diagnóstico.',
        variant: 'destructive',
      })
      navigate('/saas/credits')
      return
    }

    try {
      const res = await pb.send('/backend/v1/saas/start', {
        method: 'POST',
        body: JSON.stringify({ diagnostic_id: diag.id }),
        headers: { 'Content-Type': 'application/json' },
      })
      toast({ title: 'Diagnóstico iniciado!', className: 'bg-[#10b981] text-white border-none' })
      navigate(`/dashboard/assessment/${res.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao iniciar diagnóstico',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este diagnóstico? Os créditos serão devolvidos.'))
      return
    try {
      await pb.send(`/backend/v1/saas/cancel/${id}`, { method: 'POST' })
      toast({ title: 'Cancelado com sucesso' })
      const u = await pb.collection('users').getOne(user.id)
      setBalance(u.balance || 0)
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelado' } : r)))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const open360Links = async (resultId: string) => {
    setActive360Id(resultId)
    setLoadingLinks(true)
    try {
      const res = await pb.send('/backend/v1/saas/360-links', {
        method: 'POST',
        body: JSON.stringify({ result_id: resultId, quotas: {} }),
      })
      setLinks360(res.links)
      const newQuotas = { ...quotas }
      res.links.forEach((l: any) => {
        newQuotas[l.type as keyof typeof quotas] = l.quota
      })
      setQuotas(newQuotas)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar links', description: err.message, variant: 'destructive' })
    }
    setLoadingLinks(false)
  }

  const save360Links = async () => {
    setLoadingLinks(true)
    try {
      const res = await pb.send('/backend/v1/saas/360-links', {
        method: 'POST',
        body: JSON.stringify({ result_id: active360Id, quotas }),
      })
      setLinks360(res.links)
      toast({ title: 'Limites atualizados com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
    setLoadingLinks(false)
  }

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}/assessment/${url}`
    navigator.clipboard.writeText(fullUrl)
    toast({ title: 'Link copiado!' })
  }

  if (loading) return <div className="p-8">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meu Painel SaaS</h2>
          <p className="text-muted-foreground">Gerencie seus diagnósticos e créditos.</p>
        </div>
        <div className="flex items-center gap-4 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
          <Coins className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
            <p className="text-2xl font-bold text-primary">{balance} Créditos</p>
          </div>
          <Button asChild size="sm" className="ml-2">
            <Link to="/saas/credits">Adquirir</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {diagnostics.map((diag) => (
          <Card key={diag.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{diag.title}</CardTitle>
              <CardDescription>{diag.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold text-primary">{diag.cost} Créditos</span>
                <Button onClick={() => handleStart(diag)}>Iniciar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">Meus Diagnósticos</h3>
      <div className="bg-card rounded-lg border shadow-sm divide-y">
        {results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum diagnóstico encontrado.
          </div>
        )}
        {results.map((r) => (
          <div
            key={r.id}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="font-semibold text-lg md:text-base">
                {r.expand?.diagnostic?.title || 'Diagnóstico'}
              </p>
              <p className="text-sm text-muted-foreground">
                Iniciado em: {new Date(r.started_at || r.created).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  r.status === 'em_progresso'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : r.status === 'Concluído'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200',
                )}
              >
                {r.status}
              </span>

              {r.status === 'em_progresso' && (
                <>
                  {(r.type === 'strategic_360' ||
                    r.expand?.diagnostic?.type === 'strategic_360') && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => open360Links(r.id)}>
                          <LinkIcon className="h-4 w-4 mr-1" /> Links 360°
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gerenciar Links de Acesso 360°</DialogTitle>
                          <DialogDescription>
                            Envie os links abaixo para os respectivos níveis hierárquicos. Defina o
                            limite de respostas para cada nível.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          {loadingLinks ? (
                            <div className="text-center py-8">Carregando links...</div>
                          ) : (
                            ['estrategico', 'tatico', 'operacional'].map((type) => {
                              const linkObj = links360.find((l) => l.type === type)
                              return (
                                <div
                                  key={type}
                                  className="space-y-2 border-b pb-4 last:border-0 last:pb-0"
                                >
                                  <div className="flex justify-between items-center">
                                    <Label className="capitalize font-bold text-primary">
                                      {type}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs text-muted-foreground">
                                        Limite:
                                      </Label>
                                      <Input
                                        type="number"
                                        className="w-20 h-8 text-center"
                                        value={quotas[type as keyof typeof quotas]}
                                        onChange={(e) =>
                                          setQuotas({
                                            ...quotas,
                                            [type]: parseInt(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      readOnly
                                      value={
                                        linkObj
                                          ? `${window.location.origin}/assessment/${linkObj.url}`
                                          : '...'
                                      }
                                      className="bg-muted text-xs h-8"
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => linkObj && copyToClipboard(linkObj.url)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground text-right">
                                    Respostas: {linkObj?.used || 0} /{' '}
                                    {quotas[type as keyof typeof quotas]}
                                  </p>
                                </div>
                              )
                            })
                          )}
                          <Button className="w-full" onClick={save360Links} disabled={loadingLinks}>
                            Salvar Limites
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/assessment/${r.id}`}>Continuar</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(r.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                </>
              )}
              {r.status === 'Concluído' && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/results?id=${r.id}`}>
                    Ver Resultado <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
