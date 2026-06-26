import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, BookOpen, ExternalLink, FileText } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/hooks/use-toast'

export default function ClientBiblioteca() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      try {
        const data = await pb.collection('v1_biblioteca').getFullList({ sort: '-created' })
        setItems(data)
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

  const filtered = items.filter(
    (item) =>
      item.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      item.autor?.toLowerCase().includes(search.toLowerCase()) ||
      item.palavras_chave?.toLowerCase().includes(search.toLowerCase()) ||
      item.categoria?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6 pt-4 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-[#1e3a8a]">Biblioteca de Materiais</h2>
        <p className="text-muted-foreground mt-1">
          Glossário e recursos complementares para o seu desenvolvimento.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 h-12 text-base border-blue-200 focus-visible:ring-[#1e3a8a]"
          placeholder="Buscar por título, autor, categoria ou palavra-chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col hover:border-[#1e3a8a]/40 transition-colors shadow-sm bg-white"
            >
              <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                <div className="space-y-1 pr-4">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-800 border-blue-200 mb-2 font-medium"
                  >
                    {item.categoria || 'Geral'}
                  </Badge>
                  <CardTitle className="text-lg leading-tight text-slate-800">
                    {item.titulo}
                  </CardTitle>
                  <p className="text-sm text-slate-500 font-medium">{item.autor}</p>
                </div>
                {item.capa_url || item.capa_file ? (
                  <div className="w-16 h-20 rounded bg-slate-100 overflow-hidden shrink-0 border shadow-sm">
                    <img
                      src={item.capa_url || pb.files.getURL(item, item.capa_file)}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-20 rounded bg-slate-100 flex items-center justify-center shrink-0 border text-slate-300">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{item.descricao}</p>
                {item.palavras_chave && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {item.palavras_chave.split(',').map((p: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase tracking-wider"
                      >
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              {(item.capa_url || item.capa_file || item.observacoes) && (
                <CardFooter className="pt-0 border-t mt-auto">
                  <a
                    href={
                      item.capa_url ||
                      (item.capa_file ? pb.files.getURL(item, item.capa_file) : '#')
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-full mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#1e3a8a] hover:underline"
                  >
                    <FileText className="w-4 h-4" /> Acessar Material{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardFooter>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum material encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
