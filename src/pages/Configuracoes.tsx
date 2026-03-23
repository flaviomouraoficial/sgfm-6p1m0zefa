import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Trash2, Plus } from 'lucide-react'
import logoUrl from '../assets/logo-21a08.jpg'

const LISTS = [
  { key: 'services', label: 'Serviços Oferecidos' },
  { key: 'sessionTypes', label: 'Tipos de Sessão' },
  { key: 'companies', label: 'Empresas / Marcas' },
  { key: 'banks', label: 'Bancos' },
  { key: 'expenseCategories', label: 'Categorias de Despesa' },
  { key: 'investmentCategories', label: 'Categorias de Investimento' },
  { key: 'paymentMethods', label: 'Métodos de Pagamento' },
] as const

export default function Configuracoes() {
  const state = useMainStore()
  const { systemSettings, setSystemSettings, isSyncing } = state

  const [localSettings, setLocalSettings] = useState({
    companyName: systemSettings?.companyName || '',
    contactPhone: systemSettings?.contactPhone || '',
    contactEmail: systemSettings?.contactEmail || '',
    logo: systemSettings?.logo || '',
    defaultDuration: systemSettings?.defaultDuration || 60,
  })

  const [listInputs, setListInputs] = useState<Record<string, string>>({})

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLocalSettings({ ...localSettings, logo: event.target?.result as string })
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSave = async () => {
    try {
      await setSystemSettings(localSettings)
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso na nuvem.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações.',
        variant: 'destructive',
      })
    }
  }

  const handleAddListValue = async (key: string) => {
    const val = listInputs[key]
    if (val?.trim()) {
      await state.addListValue(key as any, val.trim())
      setListInputs({ ...listInputs, [key]: '' })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl animate-slide-up pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-accent">Configurações Gerais</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as informações da sua marca e detalhes do sistema.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Identidade Visual e Empresa</CardTitle>
          <CardDescription>
            Estes dados serão utilizados em propostas, recibos e na barra lateral.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input
                value={localSettings.companyName}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, companyName: e.target.value })
                }
                placeholder="Ex: Grupo Flávio Moura"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail Corporativo</Label>
              <Input
                type="email"
                value={localSettings.contactEmail}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, contactEmail: e.target.value })
                }
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={localSettings.contactPhone}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, contactPhone: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Duração Padrão (min)</Label>
                <Input
                  type="number"
                  value={localSettings.defaultDuration}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      defaultDuration: Number(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="w-full md:w-auto font-semibold"
              disabled={isSyncing}
            >
              {isSyncing && <RefreshCw className="w-5 h-5 mr-2 animate-spin" />}
              Salvar Identidade
            </Button>
          </div>

          <div className="space-y-4 flex flex-col items-start border-l pl-8 border-border/50">
            <Label>Logotipo do Sistema</Label>
            <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-center h-40 w-full max-w-[250px]">
              <img
                src={localSettings.logo || logoUrl}
                alt="Logo Preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <Label className="cursor-pointer bg-primary text-primary-foreground hover:bg-secondary px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Carregar Nova Imagem
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </Label>
            <p className="text-xs text-muted-foreground mt-2 leading-tight">
              O logotipo deve ser legível e será exibido com um <strong>fundo branco</strong> de
              acordo com o manual da marca.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm mt-6">
        <CardHeader>
          <CardTitle>Listas e Categorias</CardTitle>
          <CardDescription>
            Gerencie os itens disponíveis nos formulários do sistema. Os dados são sincronizados no
            banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {LISTS.map((list) => {
            const items = (state as any)[list.key] as string[]
            return (
              <div key={list.key} className="space-y-4">
                <Label className="text-base font-semibold">{list.label}</Label>
                <div className="flex gap-2">
                  <Input
                    value={listInputs[list.key] || ''}
                    onChange={(e) => setListInputs({ ...listInputs, [list.key]: e.target.value })}
                    placeholder="Novo item..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddListValue(list.key)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddListValue(list.key)}
                    disabled={state.isSyncing}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {items && items.length > 0 ? (
                    items.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1 py-1"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => state.removeListValue(list.key as any, item)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum item cadastrado.</span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
