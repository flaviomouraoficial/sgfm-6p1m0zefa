import { useState, useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, Trash2, Plus, UserCircle } from 'lucide-react'
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

type PessoaCategoria = { id: string; nome: string }

export default function Configuracoes() {
  const state = useMainStore()
  const { systemSettings, setSystemSettings, isSyncing } = state

  const [localSettings, setLocalSettings] = useState({
    companyName: systemSettings?.companyName || '',
    contactPhone: systemSettings?.contactPhone || '',
    contactEmail: systemSettings?.contactEmail || '',
    logo: systemSettings?.logo || '',
    defaultDuration: systemSettings?.defaultDuration || 60,
    defaultIvaPercent: systemSettings?.defaultIvaPercent ?? 0,
    primaryColor: systemSettings?.primaryColor || '#4f46e5',
    secondaryColor: systemSettings?.secondaryColor || '#eab308',
  })

  const [listInputs, setListInputs] = useState<Record<string, string>>({})
  const [categorias, setCategorias] = useState<PessoaCategoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true)
      const res = await pb
        .collection('v1_pessoa_categorias')
        .getFullList<PessoaCategoria>({ sort: 'nome' })
      setCategorias(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCategorias(false)
    }
  }

  useEffect(() => {
    loadCategorias()
  }, [])

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

  const handleAddCategoria = async () => {
    const val = listInputs['categorias']
    if (val?.trim()) {
      try {
        await pb.collection('v1_pessoa_categorias').create({ nome: val.trim() })
        setListInputs({ ...listInputs, categorias: '' })
        loadCategorias()
      } catch (err) {
        toast({
          title: 'Erro',
          description: 'Falha ao adicionar categoria.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleRemoveCategoria = async (id: string) => {
    try {
      await pb.collection('v1_pessoa_categorias').delete(id)
      loadCategorias()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover categoria.', variant: 'destructive' })
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
            <div className="space-y-2">
              <Label>Percentual de IVA Padrão (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={localSettings.defaultIvaPercent}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    defaultIvaPercent: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                placeholder="Ex: 15, 20..."
              />
              <p className="text-xs text-muted-foreground">
                Percentual único de IVA aplicado por padrão aos lançamentos de receita.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-border/50 mt-4">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer shrink-0"
                    value={localSettings.primaryColor}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, primaryColor: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    className="font-mono text-sm uppercase"
                    value={localSettings.primaryColor}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, primaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer shrink-0"
                    value={localSettings.secondaryColor}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, secondaryColor: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    className="font-mono text-sm uppercase"
                    value={localSettings.secondaryColor}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, secondaryColor: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="w-full md:w-auto font-semibold mt-6"
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
            Gerencie os itens disponíveis nos formulários do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-dashed">
            <Label className="text-base font-semibold flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-primary" /> Categorias de Pessoas
            </Label>
            <div className="flex gap-2">
              <Input
                value={listInputs['categorias'] || ''}
                onChange={(e) => setListInputs({ ...listInputs, categorias: e.target.value })}
                placeholder="Ex: Mentorado, Parceiro..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCategoria()
                  }
                }}
              />
              <Button type="button" onClick={handleAddCategoria} disabled={loadingCategorias}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {loadingCategorias ? (
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : categorias.length > 0 ? (
                categorias.map((cat) => (
                  <Badge key={cat.id} variant="default" className="flex items-center gap-1 py-1">
                    {cat.nome}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoria(cat.id)}
                      className="text-white/70 hover:text-white ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Nenhuma categoria cadastrada.</span>
              )}
            </div>
          </div>

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
                        className="flex items-center gap-1 py-1 border-border/50"
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
