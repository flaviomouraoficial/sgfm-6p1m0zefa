import React from 'react'
import {
  RecommendationTier,
  CommercialTableItem,
  TABLES,
  DELIVERABLES,
  TIMINGS,
  PainItem,
  ObjectionItem,
  formatUrgencyLabel,
} from '@/lib/assistente-comercial-data'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Copy, Sparkles, Check, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LiveSidePanelProps {
  tier: RecommendationTier
  productName: string
  price: number
  tableKey: string
  anchorText: string
  pains: PainItem[]
  objections: ObjectionItem[]
  qualificationPct: number
  urgency: string
  timerRunning: boolean
  timerElapsed: number
  onToggleTimer: () => void
  onResetTimer: () => void
}

export const LiveSidePanel: React.FC<LiveSidePanelProps> = ({
  tier,
  productName,
  price,
  tableKey,
  anchorText,
  pains,
  objections,
  qualificationPct,
  urgency,
  timerRunning,
  timerElapsed,
  onToggleTimer,
  onResetTimer,
}) => {
  const { toast } = useToast()
  const tableRows: CommercialTableItem[] = TABLES[tableKey] || TABLES.diag
  const deliverables = DELIVERABLES[tableKey] || DELIVERABLES.diag
  const timings = TIMINGS[tableKey] || TIMINGS.diag
  const totalTiming = timings.reduce((acc, t) => acc + t[1], 0)

  // Calcular índice do cronômetro
  const elapsedMinutes = timerElapsed / 60000
  let accumulatedMinutes = 0
  let currentTimingIdx = timings.length - 1
  for (let i = 0; i < timings.length; i++) {
    accumulatedMinutes += timings[i][1]
    if (elapsedMinutes <= accumulatedMinutes) {
      currentTimingIdx = i
      break
    }
  }

  const mins = Math.floor(timerElapsed / 60000)
  const secs = Math.floor((timerElapsed % 60000) / 1000)
  const timerFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const copyTable = () => {
    const text = tableRows
      .map((r) => {
        const val = r.carta ? 'Sob Autorização' : formatCurrency(r.v)
        return `${r.c} | ${r.e} | ${val}`
      })
      .join('\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Sucesso', description: 'Tabela comercial copiada.' })
  }

  const copyPitch = () => {
    const text = `Pitch — ${productName}\n\n${anchorText}`
    navigator.clipboard.writeText(text)
    toast({ title: 'Sucesso', description: 'Pitch copiado para a área de transferência.' })
  }

  return (
    <aside className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-200 space-y-5 lg:sticky lg:top-4 max-h-[calc(100vh-6rem)] overflow-y-auto shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Painel ao Vivo
          </h2>
        </div>
        <Badge
          variant={
            qualificationPct >= 80 ? 'default' : qualificationPct >= 50 ? 'secondary' : 'outline'
          }
          className={
            qualificationPct >= 80
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[11px]'
              : qualificationPct >= 50
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 text-[11px]'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 text-[11px]'
          }
        >
          Qualificação {qualificationPct}%
        </Badge>
      </div>

      {/* Hero da recomendação */}
      <div className="rounded-lg p-4 bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border border-blue-600/30 shadow-inner space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">
          Produto Recomendado
        </span>
        <h3 className="text-lg font-bold text-blue-200 leading-snug">{productName}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{tier.reason}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            Tabela {formatCurrency(price)}
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-300 border-slate-700">
            Urgência: {formatUrgencyLabel(urgency) || '—'}
          </Badge>
        </div>
      </div>

      {/* Tabela comercial */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Tabela Comercial
          </span>
          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
            {productName}
          </span>
        </div>
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold text-[10px] uppercase">
                <th className="text-left p-2">Condição</th>
                <th className="text-left p-2">Estrutura</th>
                <th className="text-right p-2">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tableRows.map((r, idx) => (
                <tr
                  key={idx}
                  className={idx === 1 ? 'bg-blue-500/10 font-medium' : 'hover:bg-slate-800/40'}
                >
                  <td className="p-2 align-top text-slate-200">
                    {r.c}
                    {r.carta && (
                      <span className="ml-1 text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.5 rounded-full inline-block">
                        sob autorização
                      </span>
                    )}
                  </td>
                  <td className="p-2 align-top text-slate-400 text-[11px]">{r.e}</td>
                  <td className="p-2 align-top text-right text-blue-300 font-bold whitespace-nowrap">
                    {r.carta ? 'Autorização' : formatCurrency(r.v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Argumentos de Ancoragem */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Argumentos de Ancoragem
        </span>
        <div className="p-3 rounded-lg bg-slate-900/60 border-l-4 border-blue-500 text-xs text-slate-300 leading-relaxed">
          {anchorText}
        </div>
      </div>

      {/* Entregáveis */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Entregáveis para o Pitch
        </span>
        <ul className="space-y-1 text-xs text-slate-300">
          {deliverables.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Script e Timing + Cronômetro */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Script e Timing
          </span>
          <span className="text-[11px] text-slate-400">{totalTiming} min totais</span>
        </div>

        <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
          {timings.map((t, idx) => {
            const isCurrent = idx === currentTimingIdx && timerRunning
            const isPast = idx < currentTimingIdx
            return (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs p-1.5 rounded transition-colors ${
                  isCurrent
                    ? 'bg-blue-600/20 text-blue-200 font-semibold border-l-2 border-blue-400 pl-2'
                    : isPast
                      ? 'text-slate-500'
                      : 'text-slate-300'
                }`}
              >
                <span className="truncate pr-2">{t[0]}</span>
                <span className="font-mono text-[11px] shrink-0 text-slate-400">{t[1]} min</span>
              </div>
            )
          })}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="font-mono text-xs px-2.5 py-1 text-slate-200 border-slate-700"
            >
              {timerFormatted}
            </Badge>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={timerRunning ? 'destructive' : 'default'}
                className="h-7 text-xs px-2.5"
                onClick={onToggleTimer}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3 h-3 mr-1" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" /> Iniciar
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 text-slate-300 border-slate-700 hover:bg-slate-800"
                onClick={onResetTimer}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detecção de Objeções */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Detecção de Objeções ({objections.length})
        </span>
        <div className="space-y-2">
          {objections.map((obj) => (
            <details
              key={obj.k}
              className="group border border-slate-800 rounded-lg bg-slate-900/60 overflow-hidden"
            >
              <summary className="p-2.5 text-xs font-semibold text-slate-200 cursor-pointer list-none flex items-center justify-between hover:bg-slate-800/40">
                <span>{obj.t}</span>
                <span className="text-slate-400 group-open:rotate-90 transition-transform">▸</span>
              </summary>
              <div className="px-3 pb-3 pt-1 text-xs text-slate-300 border-t border-slate-800/60 bg-slate-950/50 leading-relaxed">
                <p className="font-semibold text-blue-300 mb-1">Tratativa no tom de Flávio:</p>
                <p>{obj.tr}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyTable}
          className="flex-1 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Copy className="w-3 h-3 mr-1.5" /> Copiar Tabela
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyPitch}
          className="flex-1 text-xs border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Copy className="w-3 h-3 mr-1.5" /> Copiar Pitch
        </Button>
      </div>
    </aside>
  )
}
