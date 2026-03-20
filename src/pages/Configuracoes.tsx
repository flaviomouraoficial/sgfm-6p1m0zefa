import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Mail, Settings, Zap } from 'lucide-react'
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
  } = useMainStore()

  const [newCompany, setNewCompany] = useState('')
  const [newBank, setNewBank] = useState('')
  const [newService, setNewService] = useState('')

  const [localEmailConfig, setLocalEmailConfig] = useState(emailConfig)
  const [localAutomationConfig, setLocalAutomationConfig] = useState(automationConfig)

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      addCompany(newCompany.trim())
      setNewCompany('')
    }
  }
  const handleAddBank = () => {
    if (newBank.trim()) {
      addBank(newBank.trim())
      setNewBank('')
    }
  }
  const handleAddService = () => {
    if (newService.trim()) {
      addService(newService.trim())
      setNewService('')
    }
  }

  const handleSaveEmailConfig = () => {
    setEmailConfig(localEmailConfig)
    toast({ title: 'Configurações Salvas', description: 'Credenciais de e-mail atualizadas.' })
  }

  const handleSaveAutomationConfig = () => {
    setAutomationConfig(localAutomationConfig)
    toast({ title: 'Configurações Salvas', description: 'Regras de automação atualizadas.' })
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>

      <Tabs defaultValue="gerais" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="gerais" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Gerais
          </TabsTrigger>
          <TabsTrigger value="automacao" className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> E-mail e Automação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerais" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ConfigSection
              title="Empresas (Filtros e Cadastros)"
              items={companies}
              onAdd={handleAddCompany}
              onRemove={removeCompany}
              value={newCompany}
              setValue={setNewCompany}
            />
            <ConfigSection
              title="Bancos Integrados"
              items={banks}
              onAdd={handleAddBank}
              onRemove={removeBank}
              value={newBank}
              setValue={setNewBank}
            />
            <ConfigSection
              title="Serviços Oferecidos"
              items={services}
              onAdd={handleAddService}
              onRemove={removeService}
              value={newService}
              setValue={setNewService}
            />
          </div>
        </TabsContent>

        <TabsContent value="automacao" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email API Integration */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-primary" /> Integração de E-mail
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure a API para envio automático de boletos e notificações.
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
      </Tabs>
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
