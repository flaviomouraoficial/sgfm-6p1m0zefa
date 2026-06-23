import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react'

export default function SaasSettings() {
  const [packages, setPackages] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  // Packages State
  const [newPackage, setNewPackage] = useState({
    name: '',
    credits: 10,
    price: 99.9,
    description: '',
  })

  // Builder state
  const [selectedDiag, setSelectedDiag] = useState<string>('')
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', dimension: '', order: 1 })
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingQuestionData, setEditingQuestionData] = useState<any>(null)

  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')
  const [activeTab, setActiveTab] = useState(
    typeParam === 'packages' ? 'packages' : typeParam ? 'builder' : 'packages',
  )

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

  useEffect(() => {
    if (typeParam === 'packages') {
      setActiveTab('packages')
      return
    }
    if (typeParam && diagnostics.length > 0) {
      const diag = diagnostics.find((d) => d.type === typeParam)
      if (diag) {
        setActiveTab('builder')
        fetchQuestions(diag.id)
      }
    }
  }, [typeParam, diagnostics])

  const updatePackage = async (id: string, field: string, value: any) => {
    try {
      await pb.collection('v1_saas_credit_packages').update(id, { [field]: value })
      toast({ title: 'Salvo com sucesso' })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleAddPackage = async () => {
    if (!newPackage.name)
      return toast({ title: 'Aviso', description: 'O nome do pacote é obrigatório.' })
    try {
      await pb.collection('v1_saas_credit_packages').create({ ...newPackage, active: true })
      toast({ title: 'Pacote criado com sucesso' })
      setNewPackage({ name: '', credits: 10, price: 99.9, description: '' })
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

  const handleSaveQuestionEdit = async () => {
    if (!editingQuestionId || !editingQuestionData) return
    try {
      await pb.collection('v1_saas_questions').update(editingQuestionId, editingQuestionData)
      toast({ title: 'Questão atualizada' })
      setEditingQuestionId(null)
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle>Pacotes de Créditos</CardTitle>
                    <CardDescription>Configure os valores dos pacotes na Loja.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border space-y-4 mb-6">
                  <h4 className="font-medium text-sm">Criar Novo Pacote</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label>Nome do Pacote</Label>
                      <Input
                        value={newPackage.name}
                        onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                        placeholder="Ex: Pacote Ouro"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label>Descrição Curta</Label>
                      <Input
                        value={newPackage.description}
                        onChange={(e) =>
                          setNewPackage({ ...newPackage, description: e.target.value })
                        }
                        placeholder="Ex: Ideal para médias empresas"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Créditos</Label>
                      <Input
                        type="number"
                        value={newPackage.credits}
                        onChange={(e) =>
                          setNewPackage({ ...newPackage, credits: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        value={newPackage.price}
                        onChange={(e) =>
                          setNewPackage({ ...newPackage, price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddPackage} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Pacote
                  </Button>
                </div>

                {packages.map((pkg) => (
                  <div key={pkg.id} className="space-y-4 border-b pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <Input
                        defaultValue={pkg.name}
                        className="font-semibold text-lg max-w-[200px] border-transparent hover:border-border focus:border-border px-1"
                        onBlur={(e) =>
                          e.target.value !== pkg.name &&
                          updatePackage(pkg.id, 'name', e.target.value)
                        }
                      />
                      <Button
                        variant={pkg.active ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => updatePackage(pkg.id, 'active', !pkg.active)}
                      >
                        {pkg.active ? 'Ativo' : 'Inativo'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="sr-only">Descrição</Label>
                      <Input
                        defaultValue={pkg.description}
                        className="text-sm text-muted-foreground border-transparent hover:border-border focus:border-border px-1"
                        placeholder="Sem descrição..."
                        onBlur={(e) =>
                          e.target.value !== pkg.description &&
                          updatePackage(pkg.id, 'description', e.target.value)
                        }
                      />
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
              <CardDescription>
                Gerencie as perguntas, dimensões e nomenclaturas de cada modelo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-full md:w-1/2">
                <Label>Selecione o Modelo Base</Label>
                <Select value={selectedDiag} onValueChange={fetchQuestions}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo para editar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnostics.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} ({d.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDiag &&
                (() => {
                  const currentDiag = diagnostics.find((d) => d.id === selectedDiag)
                  const is360 = currentDiag?.type === 'strategic_360'
                  return (
                    <div className="space-y-8 pt-4">
                      <div className="grid gap-4 md:grid-cols-2 p-5 bg-muted/20 border rounded-xl shadow-sm">
                        <div className="space-y-2">
                          <Label>Título Oficial do Diagnóstico</Label>
                          <Input
                            defaultValue={currentDiag?.title}
                            onBlur={(e) => {
                              if (e.target.value !== currentDiag?.title) {
                                updateDiagnostic(selectedDiag, 'title', e.target.value)
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição Curta</Label>
                          <Input
                            defaultValue={currentDiag?.description}
                            onBlur={(e) => {
                              if (e.target.value !== currentDiag?.description) {
                                updateDiagnostic(selectedDiag, 'description', e.target.value)
                              }
                            }}
                          />
                        </div>
                      </div>

                      {is360 && (
                        <div className="grid gap-4 md:grid-cols-3 p-5 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm">
                          <div className="space-y-2">
                            <Label>Limite Estratégico</Label>
                            <Input
                              type="number"
                              defaultValue={currentDiag?.limit_strategic || 0}
                              onBlur={(e) =>
                                updateDiagnostic(
                                  selectedDiag,
                                  'limit_strategic',
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Limite Tático</Label>
                            <Input
                              type="number"
                              defaultValue={currentDiag?.limit_tactical || 0}
                              onBlur={(e) =>
                                updateDiagnostic(
                                  selectedDiag,
                                  'limit_tactical',
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Limite Operacional</Label>
                            <Input
                              type="number"
                              defaultValue={currentDiag?.limit_operational || 0}
                              onBlur={(e) =>
                                updateDiagnostic(
                                  selectedDiag,
                                  'limit_operational',
                                  parseInt(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg border-b pb-2">Banco de Questões</h4>
                        <div className="bg-muted/30 p-4 rounded-lg flex items-end gap-4 border flex-wrap md:flex-nowrap">
                          <div className="w-full md:flex-1 space-y-2">
                            <Label>Nova Pergunta</Label>
                            <Input
                              value={newQuestion.text}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, text: e.target.value })
                              }
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

                        <div className="space-y-3 mt-6">
                          {questions.map((q) => (
                            <div
                              key={q.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-all bg-white gap-4"
                            >
                              {editingQuestionId === q.id ? (
                                <div className="flex-1 flex flex-wrap md:flex-nowrap gap-3 items-end w-full">
                                  <div className="w-20 space-y-1">
                                    <Label className="text-xs">Ordem</Label>
                                    <Input
                                      type="number"
                                      value={editingQuestionData.order}
                                      onChange={(e) =>
                                        setEditingQuestionData({
                                          ...editingQuestionData,
                                          order: parseInt(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1 min-w-[200px]">
                                    <Label className="text-xs">Texto da Pergunta</Label>
                                    <Input
                                      value={editingQuestionData.text}
                                      onChange={(e) =>
                                        setEditingQuestionData({
                                          ...editingQuestionData,
                                          text: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="w-full md:w-48 space-y-1">
                                    <Label className="text-xs">Dimensão</Label>
                                    <Input
                                      value={editingQuestionData.dimension}
                                      onChange={(e) =>
                                        setEditingQuestionData({
                                          ...editingQuestionData,
                                          dimension: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                    <Button
                                      onClick={handleSaveQuestionEdit}
                                      size="icon"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => setEditingQuestionId(null)}
                                      size="icon"
                                      variant="outline"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start gap-4 flex-1">
                                    <span className="text-muted-foreground w-8 text-center font-bold bg-muted rounded-md py-1 shrink-0 mt-0.5">
                                      {q.order}
                                    </span>
                                    <div>
                                      <p className="font-medium text-gray-900 leading-snug">
                                        {q.text}
                                      </p>
                                      <p className="text-sm text-primary font-medium mt-1">
                                        Eixo: {q.dimension}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0 justify-end w-full md:w-auto">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingQuestionId(q.id)
                                        setEditingQuestionData({
                                          text: q.text,
                                          dimension: q.dimension,
                                          order: q.order,
                                        })
                                      }}
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    >
                                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          {questions.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                              Nenhuma questão cadastrada. Use o formulário acima para adicionar a
                              primeira.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
