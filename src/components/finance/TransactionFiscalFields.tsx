import React, { useState, useEffect } from 'react'
import {
  FileText,
  Landmark,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Percent,
  Coins,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FiscalConfig, FiscalRegime } from '@/lib/types'

interface FiscalFieldsProps {
  grossAmount: number
  fiscalConfig?: FiscalConfig
  isFiscalDoc: boolean
  setIsFiscalDoc: (v: boolean) => void
  regime: FiscalRegime
  setRegime: (v: FiscalRegime) => void
  cbsRate: number
  setCbsRate: (v: number) => void
  ibsRate: number
  setIbsRate: (v: number) => void
  applySplit: boolean
  setApplySplit: (v: boolean) => void
  disabled?: boolean
}

export function TransactionFiscalFields({
  grossAmount,
  fiscalConfig,
  isFiscalDoc,
  setIsFiscalDoc,
  regime,
  setRegime,
  cbsRate,
  setCbsRate,
  ibsRate,
  setIbsRate,
  applySplit,
  setApplySplit,
  disabled = false,
}: FiscalFieldsProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  const mode = fiscalConfig?.operationMode || 'teste_2026'
  const isTeste2026 = mode === 'teste_2026'

  // Cálculos
  const effectiveGross = Math.max(0, grossAmount || 0)
  const cbsAmount = isFiscalDoc
    ? Math.round(((effectiveGross * (cbsRate || 0)) / 100) * 100) / 100
    : 0
  const ibsAmount = isFiscalDoc
    ? Math.round(((effectiveGross * (ibsRate || 0)) / 100) * 100) / 100
    : 0
  const totalImpostos = cbsAmount + ibsAmount

  // Se ano-teste 2026: imposto é apenas destacado (sem pagamento/retenção efetiva conforme art. 375 LC 214/2025)
  // Se transicao_2027 e split payment ativo: o split retém o imposto na fonte bancária, creditando o líquido no caixa
  const splitAmount = isFiscalDoc && applySplit && !isTeste2026 ? totalImpostos : 0
  const netAmount = effectiveGross - splitAmount

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-border/70 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-xs">
            Reforma Tributária (IBS / CBS)
          </span>
          <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 h-5">
            {isTeste2026
              ? 'Ano-teste 2026'
              : mode === 'transicao_2027'
                ? 'Transição 2027+'
                : 'Regime Atual'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="fiscal-switch" className="text-[11px] font-medium cursor-pointer">
            Emite doc. fiscal
          </Label>
          <Switch
            id="fiscal-switch"
            checked={isFiscalDoc}
            onCheckedChange={setIsFiscalDoc}
            disabled={disabled}
          />
        </div>
      </div>

      {isFiscalDoc ? (
        <div className="space-y-3 pt-1 border-t border-border/40">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px]">Regime Fiscal</Label>
              <Select
                value={regime}
                onValueChange={(v) => setRegime(v as FiscalRegime)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caixa">Regime de Caixa (Baixa)</SelectItem>
                  <SelectItem value="competencia">Regime de Competência (Fato gerador)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Split Payment</Label>
                <Switch checked={applySplit} onCheckedChange={setApplySplit} disabled={disabled} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight pt-1">
                {applySplit
                  ? isTeste2026
                    ? 'Ativo (simulado — sem retenção no ano-teste)'
                    : 'Retém CBS/IBS na liquidação bancária'
                  : 'Desativado para este lançamento'}
              </p>
            </div>
          </div>

          {/* Card Resumo Desdobramento */}
          <div className="bg-background rounded p-2.5 border border-border/60 space-y-2">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">Valor Bruto</span>
                <span className="font-semibold text-foreground text-xs">{fmt(effectiveGross)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">CBS ({cbsRate}%)</span>
                <span className="font-semibold text-amber-600 text-xs">{fmt(cbsAmount)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">IBS ({ibsRate}%)</span>
                <span className="font-semibold text-indigo-600 text-xs">{fmt(ibsAmount)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">
                  {applySplit && !isTeste2026 ? 'Líq. Caixa (Split)' : 'Líquido'}
                </span>
                <span className="font-bold text-emerald-600 text-xs">{fmt(netAmount)}</span>
              </div>
            </div>

            {isTeste2026 && (
              <div className="flex items-center gap-1.5 text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Ano-teste 2026:</strong> CBS e IBS destacados em recibo/doc fiscal sem
                  recolhimento efetivo (compensação automática, LC 214/2025).
                </span>
              </div>
            )}

            {!isTeste2026 && applySplit && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>Split Payment ativo:</strong> R${' '}
                  {totalImpostos.toFixed(2).replace('.', ',')} retidos na liquidação da fatura.
                  Caixa recebe R$ {netAmount.toFixed(2).replace('.', ',')}.
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {detailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {detailsOpen
              ? 'Ocultar alíquotas personalizadas'
              : 'Personalizar alíquotas CBS/IBS desta transação'}
          </button>

          {detailsOpen && (
            <div className="grid grid-cols-2 gap-3 p-2 bg-muted/40 rounded border border-dashed border-border/60">
              <div className="space-y-1">
                <Label className="text-[10px] flex items-center gap-1">
                  <Percent className="w-3 h-3" /> CBS Alíquota (%)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={cbsRate}
                  onChange={(e) => setCbsRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-7 text-xs bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] flex items-center gap-1">
                  <Percent className="w-3 h-3" /> IBS Alíquota (%)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={ibsRate}
                  onChange={(e) => setIbsRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-7 text-xs bg-background"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground leading-tight">
          Marque &quot;Emite doc. fiscal&quot; para destacar CBS/IBS e calcular o impacto de split
          payment no fluxo de caixa.
        </p>
      )}
    </div>
  )
}
