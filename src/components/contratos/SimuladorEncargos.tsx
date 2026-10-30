import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calculator, AlertCircle, Calendar, ShieldAlert } from 'lucide-react'
import { ModuloContrato } from '@/lib/contratos-types'
import {
  calcularMultaModuloIndividual,
  calcularCancelamentoProgramaCompleto,
  calcularAtrasoPagamento,
} from '@/lib/contratos-motor-calculo'

interface SimuladorEncargosProps {
  modulos: ModuloContrato[]
}

export function SimuladorEncargos({ modulos }: SimuladorEncargosProps) {
  const [dataCancelamento, setDataCancelamento] = useState(() => {
    return new Date().toISOString().substring(0, 10)
  })
  const [selectedModuloId, setSelectedModuloId] = useState<string>(() => {
    return modulos[0]?.id || ''
  })
  const [dataAtrasoVencimento, setDataAtrasoVencimento] = useState('2026-10-10')
  const [dataAtrasoPagamento, setDataAtrasoPagamento] = useState('2026-10-25')
  const [valorAtrasoParcela, setValorAtrasoParcela] = useState(4000)

  const selectedModulo = modulos.find((m) => m.id === selectedModuloId) || modulos[0]

  // Cálculos
  const resModulo = selectedModulo
    ? calcularMultaModuloIndividual(
        selectedModulo.valor_parcela,
        selectedModulo.data_referencia_inicio || selectedModulo.data_ou_periodo,
        dataCancelamento,
      )
    : null

  const resPrograma = calcularCancelamentoProgramaCompleto(modulos, dataCancelamento)

  const resAtraso = calcularAtrasoPagamento(
    valorAtrasoParcela,
    dataAtrasoVencimento,
    dataAtrasoPagamento,
  )

  return (
    <Card className="border-primary/20 shadow-md bg-card/95">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base">Simulação de Encargos</CardTitle>
            <CardDescription className="text-xs">
              Motor de cálculo contratual das Cláusulas Décima e Décima Primeira
            </CardDescription>
          </div>
        </div>
        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-800 flex items-center gap-1.5 mt-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Aviso Legal:</strong> Este painel é uma ferramenta de simulação orientativa de
            penalidades contratuais, não constituindo cobrança ou faturamento.
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <Tabs defaultValue="modulo">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="modulo" className="text-xs">
              Módulo
            </TabsTrigger>
            <TabsTrigger value="programa" className="text-xs">
              Programa
            </TabsTrigger>
            <TabsTrigger value="atraso" className="text-xs">
              Atraso
            </TabsTrigger>
          </TabsList>

          {/* SIMULAÇÃO 1: MÓDULO INDIVIDUAL */}
          <TabsContent value="modulo" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Selecione o Módulo</Label>
              <Select value={selectedModuloId} onValueChange={setSelectedModuloId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione o módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.servico} (R$ {m.valor_parcela.toLocaleString('pt-BR')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data Simulada de Cancelamento/Reagendamento
              </Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={dataCancelamento}
                onChange={(e) => setDataCancelamento(e.target.value)}
              />
            </div>

            {selectedModulo && resModulo && (
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor da Parcela:</span>
                  <span className="font-semibold">
                    R${' '}
                    {selectedModulo.valor_parcela.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Antecedência Calculada:</span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {resModulo.diasAntecedencia} dias
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Regime da Cláusula Décima:</span>
                  <Badge
                    className={
                      resModulo.percentualMulta === 0
                        ? 'bg-emerald-600'
                        : resModulo.percentualMulta === 50
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                    }
                  >
                    Multa {resModulo.percentualMulta}%
                  </Badge>
                </div>
                <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
                  <span>Valor da Multa Compensatória:</span>
                  <span className="text-primary">
                    R$ {resModulo.valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground italic pt-1">
                  {resModulo.explicacao}
                </p>
              </div>
            )}
          </TabsContent>

          {/* SIMULAÇÃO 2: PROGRAMA COMPLETO */}
          <TabsContent value="programa" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data Simulada de Cancelamento do Programa
              </Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={dataCancelamento}
                onChange={(e) => setDataCancelamento(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {resPrograma.itens.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-muted/30 border text-[11px] flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground truncate max-w-[170px]">
                      {item.servico}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.regime}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">
                      R$ {item.valorEncargo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Multas (até 30 dias):</span>
                <span>
                  R$ {resPrograma.totalMultas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verba Rescisória (50% demais):</span>
                <span>
                  R${' '}
                  {resPrograma.totalRescisoria.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="pt-1.5 border-t flex justify-between text-xs font-bold text-primary">
                <span>Total de Encargos Rescisórios:</span>
                <span>
                  R$ {resPrograma.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* SIMULAÇÃO 3: ATRASO DE PAGAMENTO */}
          <TabsContent value="atraso" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Valor da Parcela</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={valorAtrasoParcela}
                  onChange={(e) => setValorAtrasoParcela(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Vencimento</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={dataAtrasoVencimento}
                  onChange={(e) => setDataAtrasoVencimento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Data Simulada de Pagamento Efetivo</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={dataAtrasoPagamento}
                onChange={(e) => setDataAtrasoPagamento(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Dias de Atraso:</span>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {resAtraso.diasAtraso} dias
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Multa Fixa (2%):</span>
                <span>
                  R$ {resAtraso.valorMulta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Juros de Mora (1% a.m. pro rata {resAtraso.jurosPercent.toFixed(2)}%):
                </span>
                <span>
                  R$ {resAtraso.valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center text-sm font-bold">
                <span>Total Atualizado a Pagar:</span>
                <span className="text-primary">
                  R$ {resAtraso.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
