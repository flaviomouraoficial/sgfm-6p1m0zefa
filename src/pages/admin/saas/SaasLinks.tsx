import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link as LinkIcon, Plus, Copy, Link2, KeyRound } from 'lucide-react'

import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  cliente_id: z.string().min(1, 'Selecione um cliente obrigatório'),
  diagnostic_id: z.string().optional(),
  quantidade_permitida: z.coerce.number().min(1, 'Mínimo 1 uso').max(1000, 'Máximo 1000'),
  link_type: z.enum(['estrategico', 'tatico', 'operacional', 'padrao']),
  data_expiracao: z.string().optional(),
})

export default function SaasLinks() {
  const [links, setLinks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: '',
      diagnostic_id: 'legacy',
      quantidade_permitida: 1,
      link_type: 'padrao',
      data_expiracao: '',
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [linksData, clientsData, diagsData] = await Promise.all([
        pb.collection('v1_assessment_links').getFullList({
          expand: 'cliente_id,criado_por,diagnostic_id',
          sort: '-created',
        }),
        pb.collection('v1_clientes').getFullList({
          sort: 'name',
        }),
        pb.collection('v1_saas_diagnostics').getFullList({
          sort: 'title',
        }),
      ])
      setLinks(linksData)
      setClients(clientsData)
      setDiagnostics(diagsData)
    } catch (error) {
      console.error('Failed to fetch data', error)
      toast({ title: 'Erro', description: 'Falha ao carregar os dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Generate a nice unique readable link fragment
      const link_unico = crypto.randomUUID().replace(/-/g, '').substring(0, 12)

      const payload: any = {
        cliente_id: values.cliente_id,
        link_unico,
        quantidade_permitida: values.quantidade_permitida,
        quantidade_usada: 0,
        status: 'ativo',
        link_type: values.link_type,
        criado_por: user.id,
      }

      if (values.diagnostic_id && values.diagnostic_id !== 'legacy') {
        payload.diagnostic_id = values.diagnostic_id
      }

      if (values.data_expiracao) {
        payload.data_expiracao = new Date(values.data_expiracao).toISOString()
      }

      await pb.collection('v1_assessment_links').create(payload)

      toast({
        title: 'Link criado com sucesso',
        description: `Novo link gerado para o assessment.`,
      })

      setDialogOpen(false)
      form.reset()
      fetchData()
    } catch (error) {
      console.error(error)
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o link.',
          variant: 'destructive',
        })
      }
    }
  }

  const copyToClipboard = (link: string) => {
    const url = `${window.location.origin}/assessment/${link}`
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link Copiado',
      description: 'URL pronta para ser enviada ao cliente!',
    })
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-emerald-500">Ativo</Badge>
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'estrategico':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
            Estratégico
          </Badge>
        )
      case 'tatico':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            Tático
          </Badge>
        )
      case 'operacional':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
            Operacional
          </Badge>
        )
      case 'padrao':
        return (
          <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">
            Padrão
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-8 h-8 text-primary" />
            Gestão de Links
          </h2>
          <p className="text-slate-500 mt-1">
            Gere e gerencie links únicos para envio de diagnósticos aos clientes.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Gerar Link de Assessment
              </DialogTitle>
              <DialogDescription>
                Crie um novo link único com limite de usos para um cliente específico.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente Associado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name || c.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnostic_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o diagnóstico..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legacy">Assessment (Sucessão)</SelectItem>
                          {diagnostics.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="link_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Link</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="padrao">Padrão</SelectItem>
                            <SelectItem value="estrategico">Estratégico</SelectItem>
                            <SelectItem value="tatico">Tático</SelectItem>
                            <SelectItem value="operacional">Operacional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantidade_permitida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usos Permitidos</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="data_expiracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Expiração (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Gerando...' : 'Gerar Link'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-slate-500" />
            Links Ativos e Histórico
          </CardTitle>
          <CardDescription>
            Controle de acessos e monitoramento de uso dos formulários.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700">Diagnóstico</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">
                    Uso (Realizado / Limite)
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">Validade</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Carregando links...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Nenhum link gerado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((link) => (
                    <TableRow key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        {link.expand?.cliente_id?.name || 'Sem Cliente'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {link.expand?.diagnostic_id?.title || 'Assessment (Sucessão)'}
                      </TableCell>
                      <TableCell>{getTypeBadge(link.link_type)}</TableCell>
                      <TableCell>{getStatusBadge(link.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono bg-white">
                          <span
                            className={
                              link.quantidade_usada >= link.quantidade_permitida
                                ? 'text-red-500 font-bold'
                                : ''
                            }
                          >
                            {link.quantidade_usada || 0}
                          </span>{' '}
                          / {link.quantidade_permitida}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {link.data_expiracao
                          ? format(new Date(link.data_expiracao), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Sem validade'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary transition-colors text-slate-600"
                          onClick={() => copyToClipboard(link.link_unico)}
                        >
                          <Copy className="w-4 h-4 mr-1.5" /> Copiar Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
