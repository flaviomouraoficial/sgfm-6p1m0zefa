import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Trash2,
  Plus,
  Mail,
  Settings,
  Zap,
  Server,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const {
    companies,
    banks,
    services,
    addCompany,
    removeCompany,
    addBank,
    removeBank,
    addService,
    removeService,
    emailConfig,
    automationConfig,
    setEmailConfig,
    setAutomationConfig,
    isInitialLoad,
    resetSystem,
  } = useMainStore()

  const navigate = useNavigate()

  const [newCompany, setNewCompany] = useState('')
  const [newBank, setNewBank] = useState('')
  const [newService, setNewService] = useState('')

  const [localEmailConfig, setLocalEmailConfig] = useState(emailConfig)
  const [localAutomationConfig, setLocalAutomationConfig] = useState(automationConfig)

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copiado!', description: `${text} copiado para a área de transferência.` })
  }

  const handleAddCompany = async () => {
    if (newCompany.trim()) {
      try {
        await addCompany(newCompany.trim())
        setNewCompany('')
        toast({ title: 'Sucesso', description: 'Empresa adicionada no banco de dados na nuvem.' })
      } catch (e: any) {
        toast({ title: 'Erro de Conexão', description: e.message, variant: 'destructive' })
      }
    }
  }

  const handleAddBank = async () => {
    if (newBank.trim()) {
      try {
        await addBank(newBank.trim())
        setNewBank('')
        toast({ title: 'Sucesso', description: 'Banco adicionado com sucesso.' })
      } catch (e: any) {
        toast({ title: 'Erro de Conexão', description: e.message, variant: 'destructive' })
      }
    }
  }

  const handleAddService = async () => {
    if (newService.trim()) {
      try {
        await addService(newService.trim())
        setNewService('')
        toast({ title: 'Sucesso', description: 'Serviço salvo na nuvem.' })
      } catch (e: any) {
        toast({ title: 'Erro de Conexão', description: e.message, variant: 'destructive' })
      }
    }
  }

  const handleRemoveCompany = async (c: string) => {
    try {
      await removeCompany(c)
      toast({ title: 'Removido', description: 'Empresa removida com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleRemoveBank = async (b: string) => {
    try {
      await removeBank(b)
      toast({ title: 'Removido', description: 'Banco removido com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleRemoveService = async (s: string) => {
    try {
      await removeService(s)
      toast({ title: 'Removido', description: 'Serviço removido com sucesso.' })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveEmailConfig = async () => {
    try {
      await setEmailConfig(localEmailConfig)
      toast({
        title: 'Configurações Salvas',
        description: 'Credenciais de e-mail atualizadas na nuvem.',
      })
    } catch (e: any) {
      toast({ title: 'Erro de Conexão', description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveAutomationConfig = async () => {
    try {
      await setAutomationConfig(localAutomationConfig)
      toast({
        title: 'Configurações Salvas',
        description: 'Regras de automação atualizadas na nuvem.',
      })
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    }
  }

  const handleResetSystem = async () => {
    try {
      await resetSystem()
      setIsResetDialogOpen(false)
      toast({
        title: 'Sistema Reiniciado',
        description: 'Todos os registros foram excluídos da nuvem com sucesso.',
      })
      navigate('/')
    } catch (e: any) {
      toast({ title: 'Erro Crítico', description: e.message, variant: 'destructive' })
    }
  }

  if (isInitialLoad) {
    return (
      <div className="space-y-6 animate-fade-in max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>

      <Tabs defaultValue="gerais" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-2">
          <TabsTrigger value="gerais" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Gerais
          </TabsTrigger>
          <TabsTrigger value="automacao" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Automações
          </TabsTrigger>
          <TabsTrigger value="servidor" className="flex items-center gap-2">
            <Server className="w-4 h-4" /> Servidor de E-mail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerais" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ConfigSection
              title="Empresas (Filtros e Cadastros)"
              items={companies}
              onAdd={handleAddCompany}
              onRemove={handleRemoveCompany}
              value={newCompany}
              setValue={setNewCompany}
            />
            <ConfigSection
              title="Bancos Integrados"
              items={banks}
              onAdd={handleAddBank}
              onRemove={handleRemoveBank}
              value={newBank}
              setValue={setNewBank}
            />
            <ConfigSection
              title="Serviços Oferecidos"
              items={services}
              onAdd={handleAddService}
              onRemove={handleRemoveService}
              value={newService}
              setValue={setNewService}
            />

            {/* System Reset / Maintenance */}
            <Card className="shadow-sm border-destructive/20 md:col-span-2 lg:col-span-3 mt-4">
              <CardHeader className="border-b bg-destructive/5 pb-4">
                <CardTitle className="text-base flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Manutenção do Sistema e Nuvem
                </CardTitle>
                <CardDescription className="text-xs">
                  Ações críticas que afetam todo o banco de dados na nuvem e registros do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button variant="destructive" onClick={() => setIsResetDialogOpen(true)}>
                  Excluir todos os registros e limpar memória
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automacao" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email API Integration */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-primary" /> API de Envio Transacional
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure o provedor para envio automático pelo sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Provedor de E-mail</Label>
                  <Select
                    value={localEmailConfig.provider}
                    onValueChange={(v: any) =>
                      setLocalEmailConfig({ ...localEmailConfig, provider: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SendGrid">SendGrid</SelectItem>
                      <SelectItem value="Mailgun">Mailgun</SelectItem>
                      <SelectItem value="Nenhum">Nenhum (Desativado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chave da API (API Key)</Label>
                  <Input
                    type="password"
                    placeholder="sg.xxxxxxxxxxxx..."
                    value={localEmailConfig.apiKey}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, apiKey: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Remetente</Label>
                  <Input
                    type="email"
                    placeholder="contato@seusite.com.br"
                    value={localEmailConfig.senderEmail}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, senderEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Remetente</Label>
                  <Input
                    placeholder="Flávio Moura Mentoria"
                    value={localEmailConfig.senderName}
                    onChange={(e) =>
                      setLocalEmailConfig({ ...localEmailConfig, senderName: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveEmailConfig} className="w-full mt-2">
                  Salvar Credenciais
                </Button>
              </CardContent>
            </Card>

            {/* Automation Workflow */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-accent" /> Fluxo de Cobrança Automatizado
                </CardTitle>
                <CardDescription className="text-xs">
                  Defina os gatilhos para envio de notificações aos mentorados.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Enviar Boleto Automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Dispara um e-mail assim que a parcela é gerada no financeiro.
                    </p>
                  </div>
                  <Switch
                    checked={localAutomationConfig.sendSlipOnGeneration}
                    onCheckedChange={(v) =>
                      setLocalAutomationConfig({
                        ...localAutomationConfig,
                        sendSlipOnGeneration: v,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm">Lembrete de Vencimento</Label>
                    <p className="text-xs text-muted-foreground">
                      Envia um aviso dias antes do vencimento da fatura.
                    </p>
                  </div>
                  <Switch
                    checked={localAutomationConfig.sendReminder}
                    onCheckedChange={(v) =>
                      setLocalAutomationConfig({ ...localAutomationConfig, sendReminder: v })
                    }
                  />
                </div>

                {localAutomationConfig.sendReminder && (
                  <div className="pl-4 border-l-2 border-primary/20 space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-xs text-muted-foreground">Dias de antecedência</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      className="w-24 h-8 text-sm"
                      value={localAutomationConfig.reminderDaysBefore}
                      onChange={(e) =>
                        setLocalAutomationConfig({
                          ...localAutomationConfig,
                          reminderDaysBefore: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Aviso de Atraso</Label>
                    <p className="text-xs text-muted-foreground">
                      Notifica o mentorado no dia seguinte ao vencimento se o status estiver
                      Pendente.
                    </p>
                  </div>
                  <Switch
                    checked={localAutomationConfig.sendOverdue}
                    onCheckedChange={(v) =>
                      setLocalAutomationConfig({ ...localAutomationConfig, sendOverdue: v })
                    }
                  />
                </div>

                <Button
                  onClick={handleSaveAutomationConfig}
                  className="w-full mt-4"
                  variant="secondary"
                >
                  Salvar Regras
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servidor" className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b bg-muted/10 pb-4">
              <CardTitle className="text-base flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary" /> Acesso Webmail
              </CardTitle>
              <CardDescription className="text-xs">
                Acesse sua caixa de entrada e gerencie seus e-mails corporativos pelo navegador.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground max-w-xl">
                O Webmail permite ler e enviar mensagens de qualquer dispositivo sem a necessidade
                de configurar um aplicativo dedicado de e-mail.
              </p>
              <Button asChild className="shrink-0">
                <a href="https://webmail.umbler.com.br" target="_blank" rel="noreferrer">
                  Acessar Webmail <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-primary" /> Dados do Servidor de E-mail (Umbler)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Utilize os dados abaixo para configurar suas contas de e-mail em smartphones ou
              softwares de desktop.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* IMAP */}
              <Card className="shadow-sm border-border/50 flex flex-col">
                <CardHeader className="border-b bg-muted/5 pb-4">
                  <CardTitle className="text-base">Servidor de Entrada (IMAP)</CardTitle>
                  <CardDescription className="text-xs">
                    Recomendado. Mantém mensagens sincronizadas no servidor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-semibold text-muted-foreground">Endereço</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-muted/30 px-2 py-0.5 rounded text-foreground">
                        imap.umbler.com.br
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('imap.umbler.com.br')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-semibold text-muted-foreground">Porta 993</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> SSL/TLS enabled
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('993')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* POP3 */}
              <Card className="shadow-sm border-border/50 flex flex-col">
                <CardHeader className="border-b bg-muted/5 pb-4">
                  <CardTitle className="text-base">Servidor de Entrada (POP3)</CardTitle>
                  <CardDescription className="text-xs">
                    Baixa mensagens localmente, removendo do servidor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-semibold text-muted-foreground">Endereço</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-muted/30 px-2 py-0.5 rounded text-foreground">
                        pop.umbler.com.br
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('pop.umbler.com.br')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-semibold text-muted-foreground">Porta 995</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> SSL/TLS enabled
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('995')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SMTP */}
              <Card className="shadow-sm border-border/50 md:col-span-2 lg:col-span-1 flex flex-col">
                <CardHeader className="border-b bg-muted/5 pb-4">
                  <CardTitle className="text-base">Servidor de Saída (SMTP)</CardTitle>
                  <CardDescription className="text-xs">
                    Configuração necessária para o envio de e-mails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-semibold text-muted-foreground">Endereço</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium bg-muted/30 px-2 py-0.5 rounded text-foreground">
                        smtp.umbler.com.br
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('smtp.umbler.com.br')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-semibold text-muted-foreground">Porta 465 ou 587</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> SSL/TLS/STARTTLS
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy('587')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção: Ação Irreversível</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir todos os registros? Esta ação irá limpar todo o banco
              de dados na nuvem e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetSystem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ConfigSectionProps {
  title: string
  items: string[]
  onAdd: () => void
  onRemove: (item: string) => void
  value: string
  setValue: (val: string) => void
}

function ConfigSection({ title, items, onAdd, onRemove, value, setValue }: ConfigSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex space-x-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Adicionar novo..."
            className="text-xs h-9"
          />
          <Button onClick={onAdd} size="icon" className="h-9 w-9 bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 text-accent-foreground" />
          </Button>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded-md text-xs font-medium border border-border/50"
            >
              <span>{item}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item)}
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-xs text-muted-foreground text-center py-2">
              Nenhum item cadastrado
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
