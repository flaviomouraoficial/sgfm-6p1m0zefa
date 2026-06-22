import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FilterX,
  BarChart3,
} from 'lucide-react'
import { createZip, createSimplePdf } from '@/lib/zip'
import { format } from 'date-fns'

const chartConfig = {
  value: { label: 'Respondentes' },
  D: { label: 'Dominância (D)', color: 'hsl(var(--chart-1))' },
  I: { label: 'Influência (I)', color: 'hsl(var(--chart-2))' },
  S: { label: 'Estabilidade (S)', color: 'hsl(var(--chart-3))' },
  C: { label: 'Conformidade (C)', color: 'hsl(var(--chart-4))' },
}

export default function DiscResults() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [respostas, setRespostas] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dashboard & Filters
  const [dashboardData, setDashboardData] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])

  const loadDashboardData = useCallback(async () => {
    setDashboardLoading(true)
    try {
      const all = await pb
        .collection('v1_disc_respostas')
        .getFullList({ fields: 'perfil_predominante' })
      const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 }
      let totalValid = 0
      all.forEach((r) => {
        const p = (r.perfil_predominante || '').toUpperCase()
        if (counts[p] !== undefined) {
          counts[p]++
          totalValid++
        } else if (p.includes('D')) {
          counts['D']++
          totalValid++
        } else if (p.includes('I')) {
          counts['I']++
          totalValid++
        } else if (p.includes('S')) {
          counts['S']++
          totalValid++
        } else if (p.includes('C')) {
          counts['C']++
          totalValid++
        }
      })
      const total = totalValid || 1
      const data = [
        { name: 'Dominância (D)', profile: 'D', value: counts['D'], fill: 'var(--color-D)' },
        { name: 'Influência (I)', profile: 'I', value: counts['I'], fill: 'var(--color-I)' },
        { name: 'Estabilidade (S)', profile: 'S', value: counts['S'], fill: 'var(--color-S)' },
        { name: 'Conformidade (C)', profile: 'C', value: counts['C'], fill: 'var(--color-C)' },
      ]
        .filter((d) => d.value > 0)
        .map((d) => ({ ...d, percentage: ((d.value / total) * 100).toFixed(1) }))
      setDashboardData(data)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let filter = ''
      const conditions = []

      if (search.trim()) {
        const s = search.trim().replace(/'/g, "\\'")
        conditions.push(`(nome ~ '${s}' || email ~ '${s}')`)
      }

      if (selectedProfiles.length > 0) {
        const profileConditions = selectedProfiles.map((p) => `perfil_predominante = '${p}'`)
        conditions.push(`(${profileConditions.join(' || ')})`)
      }

      if (conditions.length > 0) {
        filter = conditions.join(' && ')
      }

      const result = await pb.collection('v1_disc_respostas').getList(page, perPage, {
        filter,
        sort: '-created',
      })

      setRespostas(result.items)
      setTotalItems(result.totalItems)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, selectedProfiles, toast])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useRealtime('v1_disc_respostas', () => {
    loadDashboardData()
    loadData()
  })

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search, selectedProfiles, loadData, page])

  const totalPages = Math.ceil(totalItems / perPage)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedIds)
      respostas.forEach((r) => newSelected.add(r.id))
      setSelectedIds(newSelected)
    } else {
      const newSelected = new Set(selectedIds)
      respostas.forEach((r) => newSelected.delete(r.id))
      setSelectedIds(newSelected)
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return
    setExporting(true)

    try {
      const idsQuery = Array.from(selectedIds)
        .map((id) => `id='${id}'`)
        .join(' || ')
      const allSelectedItems = await pb.collection('v1_disc_respostas').getFullList({
        filter: idsQuery,
      })

      const files = await Promise.all(
        allSelectedItems.map(async (item) => {
          const text = `Resultados DISC - ${item.nome}\nEmail: ${item.email}\nPerfil Predominante: ${item.perfil_predominante}\nPontuações:\nD: ${item.pontuacao_d}\nI: ${item.pontuacao_i}\nS: ${item.pontuacao_s}\nC: ${item.pontuacao_c}\nData: ${format(new Date(item.created), 'dd/MM/yyyy HH:mm')}`
          const pdfBlob = await createSimplePdf(text, `DISC - ${item.nome}`)
          return {
            name: `DISC_${item.nome.replace(/\s+/g, '_')}_${item.id}.pdf`,
            data: pdfBlob,
          }
        }),
      )

      const zipBlob = await createZip(files)
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Resultados_DISC.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({ title: 'Exportação concluída', description: 'Arquivo ZIP gerado com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const toggleProfileFilter = (profile: string) => {
    setPage(1)
    setSelectedProfiles((prev) =>
      prev.includes(profile) ? prev.filter((p) => p !== profile) : [...prev, profile],
    )
  }

  const clearFilters = () => {
    setSelectedProfiles([])
    setSearch('')
    setPage(1)
  }

  const profileColors: Record<string, string> = {
    D: 'bg-red-500/10 text-red-600 border-red-200',
    I: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    S: 'bg-green-500/10 text-green-600 border-green-200',
    C: 'bg-blue-500/10 text-blue-600 border-blue-200',
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/disc')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resultados DISC</h1>
          <p className="text-muted-foreground">
            Analise as respostas e a distribuição de perfis dos respondentes.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribuição de Perfis
          </CardTitle>
          <CardDescription>Visão geral de todos os assessments concluídos</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardLoading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboardData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{name}</span>
                              <span className="text-muted-foreground">
                                {value} respondentes ({item.payload.percentage}%)
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={dashboardData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {dashboardData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Respondentes</CardTitle>
              <CardDescription>Gerencie e exporte os resultados individuais</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Button
                onClick={handleExportSelected}
                disabled={selectedIds.size === 0 || exporting}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Exportar ({selectedIds.size})
              </Button>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Filtrar por Perfil:
            </span>
            {['D', 'I', 'S', 'C'].map((p) => (
              <Badge
                key={p}
                variant={selectedProfiles.includes(p) ? 'default' : 'outline'}
                className={`cursor-pointer hover:opacity-80 transition-opacity ${selectedProfiles.includes(p) ? '' : profileColors[p] || ''}`}
                onClick={() => toggleProfileFilter(p)}
              >
                Perfil {p}
              </Badge>
            ))}
            {(selectedProfiles.length > 0 || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-7 ml-auto"
              >
                <FilterX className="w-4 h-4 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 pl-4">
                    <Checkbox
                      checked={respostas.length > 0 && selectedIds.size === respostas.length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Perfil Predominante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : respostas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  respostas.map((r) => (
                    <TableRow key={r.id} className="group">
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(r.id)}
                          onCheckedChange={(checked) => handleSelectOne(r.id, checked as boolean)}
                          aria-label={`Selecionar ${r.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={profileColors[r.perfil_predominante] || ''}
                        >
                          {r.perfil_predominante || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(r.created), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigate(`/admin/disc/report/${r.id}`)}
                        >
                          Ver Relatório
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * perPage + 1} até {Math.min(page * perPage, totalItems)} de{' '}
                {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
