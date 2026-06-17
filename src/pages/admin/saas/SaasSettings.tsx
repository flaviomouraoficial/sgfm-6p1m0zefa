import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'

export default function SaasSettings() {
  const [packages, setPackages] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  // Builder state
  const [selectedDiag, setSelectedDiag] = useState<string>('')
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', dimension: '', order: 1 })

  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setPackages(await pb.collection('v1_saas_credit_packages').getFullList({ sort: 'price' }))
      setDiagnostics(await pb.collection('v1_saas_diagnostics').getFullList({ sort: 'title' }))
      const sett = await pb.collection('v1_saas_settings').getList(1, 1)
      if (sett.items.length > 0) setSettings(sett.items[0])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchQuestions = async (diagId: string) => {
    setSelectedDiag(diagId)
    try {
      const qs = await pb.collection('v1_saas_questions').getFullList({
        filter: `diagnostic="${diagId}"`,
        sort: 'order',
      })
      setQuestions(qs)
      setNewQuestion((prev) => ({ ...prev, order: qs.length + 1 }))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const updatePackage = async (id: string, field: string, value: any) => {
    try {
      await pb.collection('v1_saas_credit_packages').update(id, { [field]: value })
      toast({ title: 'Salvo com sucesso' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const updateDiagnostic = async (id: string, field: string, value: any) => {
    try {
      await pb.collection('v1_saas_diagnostics').update(id, { [field]: value })
      toast({ title: 'Salvo com sucesso' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      if (settings) {
        await pb.collection('v1_saas_settings').update(settings.id, formData)
      } else {
        await pb.collection('v1_saas_settings').create(formData)
      }
      toast({ title: 'Configurações salvas' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleAddQuestion = async () => {
    if (!selectedDiag || !newQuestion.text || !newQuestion.dimension) return
    try {
      await pb.collection('v1_saas_questions').create({
        ...newQuestion,
        diagnostic: selectedDiag,
      })
      toast({ title: 'Questão adicionada' })
      setNewQuestion({ text: '', dimension: '', order: questions.length + 2 })
      fetchQuestions(selectedDiag)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    try {
      await pb.collection('v1_saas_questions').delete(id)
      toast({ title: 'Questão removida' })
      fetchQuestions(selectedDiag)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações SaaS</h2>
        <p className="text-muted-foreground">
          Gerencie o sistema de diagnósticos, pacotes e branding da plataforma.
        </p>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Pacotes & Valores</TabsTrigger>
          <TabsTrigger value="builder">Model Builder</TabsTrigger>
          <TabsTrigger value="branding">Branding & Logo</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Custo dos Diagnósticos</CardTitle>
                <CardDescription>Defina quantos créditos cada avaliação consome.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {diagnostics.map((diag) => (
                  <div
                    key={diag.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold">{diag.title}</p>
                      <p className="text-sm text-muted-foreground">{diag.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24 text-center"
                        defaultValue={diag.cost}
                        onBlur={(e) =>
                          updateDiagnostic(diag.id, 'cost', parseFloat(e.target.value))
                        }
                      />
                      <span className="text-sm text-muted-foreground font-medium">créditos</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacotes de Créditos</CardTitle>
                <CardDescription>Configure os valores dos pacotes na Loja.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="space-y-4 border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{pkg.name}</h4>
                      <Button
                        variant={pkg.active ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => updatePackage(pkg.id, 'active', !pkg.active)}
                      >
                        {pkg.active ? 'Ativo' : 'Inativo'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Créditos</Label>
                        <Input
                          type="number"
                          defaultValue={pkg.credits}
                          onBlur={(e) =>
                            updatePackage(pkg.id, 'credits', parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          defaultValue={pkg.price}
                          onBlur={(e) => updatePackage(pkg.id, 'price', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Construtor de Diagnósticos</CardTitle>
              <CardDescription>Gerencie as perguntas e dimensões de cada modelo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-full md:w-1/3">
                <Label>Selecione o Diagnóstico</Label>
                <Select value={selectedDiag} onValueChange={fetchQuestions}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnostics.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDiag && (
                <div className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg flex items-end gap-4 border flex-wrap md:flex-nowrap">
                    <div className="w-full md:flex-1 space-y-2">
                      <Label>Nova Pergunta</Label>
                      <Input
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                        placeholder="Ex: Como você avalia a comunicação?"
                      />
                    </div>
                    <div className="w-full md:w-1/3 space-y-2">
                      <Label>Eixo / Dimensão</Label>
                      <Input
                        value={newQuestion.dimension}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, dimension: e.target.value })
                        }
                        placeholder="Ex: Relacionamento"
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={newQuestion.order}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, order: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <Button onClick={handleAddQuestion} className="w-full md:w-auto">
                      <Plus className="w-4 h-4 md:mr-2" />{' '}
                      <span className="hidden md:inline">Adicionar</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-muted-foreground w-6 text-center font-medium bg-muted rounded-md py-1">
                            {q.order}
                          </span>
                          <div>
                            <p className="font-medium">{q.text}</p>
                            <p className="text-xs text-muted-foreground">Eixo: {q.dimension}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-red-500 hover:text-red-700 ml-4 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {questions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma questão cadastrada para este modelo.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>
                Personalize a plataforma com a sua marca. O logo aparecerá no topo e nos relatórios
                em PDF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input name="company_name" defaultValue={settings?.company_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Logo Oficial (Recomendado: fundo transparente)</Label>
                  <Input name="logo" type="file" accept="image/*" />
                  {settings?.logo && (
                    <div className="mt-4 p-4 border rounded bg-muted/20 w-max shadow-sm">
                      <img
                        src={pb.files.getUrl(settings, settings.logo)}
                        alt="Logo"
                        className="h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
                <Button type="submit">Salvar Identidade</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
