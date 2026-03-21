import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'
import logoUrl from '../assets/logo-21a08.jpg'

export default function Configuracoes() {
  const { systemSettings, setSystemSettings, isSyncing } = useMainStore()
  const [localSettings, setLocalSettings] = useState({
    companyName: systemSettings?.companyName || '',
    contactPhone: systemSettings?.contactPhone || '',
    contactEmail: systemSettings?.contactEmail || '',
    logo: systemSettings?.logo || '',
  })

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

  return (
    <div className="space-y-6 max-w-4xl animate-slide-up">
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

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          size="lg"
          className="w-full md:w-auto font-semibold"
          disabled={isSyncing}
        >
          {isSyncing && <RefreshCw className="w-5 h-5 mr-2 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
