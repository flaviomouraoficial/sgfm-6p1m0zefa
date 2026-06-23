import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LinkIcon, CalendarDays, Coins, FileText, ArrowRight, Clock } from 'lucide-react'

export default function ClientDashboard() {
  const { user } = useAuth()

  const perms = user?.permissions || {}
  const showLinks = perms.links !== false
  const showAgenda = perms.agenda !== false
  const showCredits = perms.credits !== false
  const showReports = perms.reports !== false

  const [links, setLinks] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    try {
      const promises = []

      if (showLinks) {
        promises.push(
          pb
            .collection('v1_assessment_links')
            .getList(1, 5, {
              filter: `cliente_id.email = '${user.email}' && status = 'ativo'`,
              sort: '-created',
              expand: 'diagnostic_id',
            })
            .then((res) => setLinks(res.items))
            .catch(() => setLinks([])),
        )
      }

      if (showAgenda) {
        const now = new Date().toISOString().replace('T', ' ')
        promises.push(
          pb
            .collection('v1_agendamentos')
            .getList(1, 5, {
              filter: `cliente_email = '${user.email}' && data_horario >= '${now}'`,
              sort: 'data_horario',
              expand: 'servico_id,profissional_id',
            })
            .then((res) => setAgendamentos(res.items))
            .catch(() => setAgendamentos([])),
        )
      }

      if (showReports) {
        promises.push(
          pb
            .collection('v1_saas_results')
            .getList(1, 5, {
              filter: `client = '${user.id}'`,
              sort: '-created',
              expand: 'diagnostic',
            })
            .then((res) => setResults(res.items))
            .catch(() => setResults([])),
        )
      }

      await Promise.all(promises)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  useRealtime('v1_assessment_links', () => {
    if (showLinks) fetchData()
  })
  useRealtime('v1_agendamentos', () => {
    if (showAgenda) fetchData()
  })
  useRealtime('v1_saas_results', () => {
    if (showReports) fetchData()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-accent">Meu Painel</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a), {user?.name || 'Cliente'}! Aqui está o resumo das suas atividades.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p>Carregando painel...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {showCredits && (
            <Card className="flex flex-col shadow-sm border-primary/20 bg-primary/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Coins className="w-5 h-5 mr-2 text-primary" />
                  Seus Créditos
                </CardTitle>
                <CardDescription>Saldo disponível para novos mapeamentos</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="text-5xl font-bold text-primary">{user?.balance || 0}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium">créditos na conta</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/saas/credits">
                    Comprar Mais Créditos <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {showLinks && (
            <Card className="flex flex-col shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <LinkIcon className="w-5 h-5 mr-2 text-primary" />
                  Links de Diagnóstico
                </CardTitle>
                <CardDescription>Seus links ativos para envio</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <LinkIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum link ativo encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {link.expand?.diagnostic_id?.title || 'Diagnóstico Padrão'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Usos: {link.quantidade_usada || 0} / {link.quantidade_permitida}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8">
                          <Link to={`/dashboard/assessment/${link.id}`}>Acessar</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {showReports && (
            <Card className="flex flex-col shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Relatórios Recentes
                </CardTitle>
                <CardDescription>Resultados de diagnósticos concluídos</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <FileText className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum relatório encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((res) => (
                      <div
                        key={res.id}
                        className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {res.expand?.diagnostic?.title || 'Relatório de Diagnóstico'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(res.created), 'dd/MM/yyyy')} • {res.status}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8">
                          <Link to="/dashboard/results">Abrir</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {results.length > 0 && (
                <CardFooter className="pt-2">
                  <Button variant="outline" asChild className="w-full h-9">
                    <Link to="/dashboard/results">Ver Todos os Relatórios</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}

          {showAgenda && (
            <Card className="flex flex-col shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                  Próximos Agendamentos
                </CardTitle>
                <CardDescription>Suas reuniões e sessões marcadas</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {agendamentos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <CalendarDays className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum agendamento futuro encontrado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agendamentos.map((ag) => {
                      const d = parseISO(ag.data_horario.split('.')[0].replace(' ', 'T'))
                      return (
                        <div
                          key={ag.id}
                          className="flex flex-col border-b pb-3 last:border-0 last:pb-0"
                        >
                          <p className="font-medium text-sm">
                            {ag.expand?.servico_id?.nome || 'Sessão de Acompanhamento'}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              {format(d, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                              {ag.status || 'Confirmado'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
