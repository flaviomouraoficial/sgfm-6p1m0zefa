import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ProtensoraCaminhosAdmin() {
  const [reforcos, setReforcos] = useState<any[]>([])
  const [avancos, setAvancos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const [ref, ava] = await Promise.all([
          pb
            .collection('v1_protensora_reforco')
            .getFullList({ expand: 'unidade_id', sort: '-created' }),
          pb
            .collection('v1_protensora_avanco')
            .getFullList({ expand: 'unidade_origem_id', sort: '-created' }),
        ])
        setReforcos(ref)
        setAvancos(ava)
      } catch (err: any) {
        toast({
          title: 'Erro ao carregar',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Caminhos Adaptativos</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie o conteúdo exibido aos alunos com base no desempenho. (Abaixo de 50% = Reforço |
          Acima de 80% = Avanço).
        </p>
      </div>

      <Tabs defaultValue="reforco" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reforco">Conteúdo de Reforço</TabsTrigger>
          <TabsTrigger value="avanco">Conteúdo de Avanço (Desafios)</TabsTrigger>
        </TabsList>

        <TabsContent value="reforco" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reforços Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center">Carregando...</div>
              ) : reforcos.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum conteúdo de reforço cadastrado. Acesse a edição de Aulas para adicionar.
                </div>
              ) : (
                <div className="grid gap-4">
                  {reforcos.map((r) => (
                    <div key={r.id} className="p-4 border rounded-lg bg-red-50/30 border-red-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-red-900">{r.titulo}</h4>
                          <p className="text-xs text-red-600 font-medium">
                            Vinculado à Aula: {r.expand?.unidade_id?.titulo || 'Desconhecida'}
                          </p>
                        </div>
                      </div>
                      <div
                        className="text-sm text-slate-700 bg-white p-3 rounded border border-red-100/50 mt-2"
                        dangerouslySetInnerHTML={{ __html: r.texto }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="avanco" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desafios / Avanços Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center">Carregando...</div>
              ) : avancos.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum conteúdo de avanço cadastrado. Acesse a edição de Aulas para adicionar.
                </div>
              ) : (
                <div className="grid gap-4">
                  {avancos.map((a) => (
                    <div key={a.id} className="p-4 border rounded-lg bg-blue-50/30 border-blue-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-blue-900">{a.titulo}</h4>
                          <p className="text-xs text-blue-600 font-medium">
                            Vinculado à Aula:{' '}
                            {a.expand?.unidade_origem_id?.titulo || 'Desconhecida'}
                          </p>
                        </div>
                        {a.xp_bonus > 0 && (
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            +{a.xp_bonus} XP
                          </span>
                        )}
                      </div>
                      <div
                        className="text-sm text-slate-700 bg-white p-3 rounded border border-blue-100/50 mt-2"
                        dangerouslySetInnerHTML={{ __html: a.texto }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
