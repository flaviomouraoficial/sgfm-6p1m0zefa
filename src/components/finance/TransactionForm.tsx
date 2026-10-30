import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Transaction, TransactionType, TransactionStatus } from '@/lib/types'
import { useMainStore } from '@/stores/main'
import { formatCurrencyInput, parseCurrencyInput, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransactionAuditTimeline } from '@/components/finance/TransactionAuditTimeline'
import { TransactionFiscalFields } from './TransactionFiscalFields'
import { FiscalRegime } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultType: TransactionType
  transactionToEdit?: Transaction | null
}

import { useFinanceStore } from '@/stores/finance'

export function TransactionForm({ open, onOpenChange, defaultType, transactionToEdit }: Props) {
  const {
    addTransaction,
    addTransactions,
    updateTransaction,
    services,
    expenseCategories,
    systemSettings,
    isSyncing,
  } = useMainStore()
  const { contas, fetchContas } = useFinanceStore()

  const defaultIvaPercent = systemSettings?.defaultIvaPercent ?? 0

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: defaultType,
    status: 'Pendente',
    category: defaultType === 'Receita' ? services[0] || '' : expenseCategories[0] || '',
    date: new Date().toISOString().split('T')[0],
    conta_id: '',
  })

  const [displayAmount, setDisplayAmount] = useState('')
  const [dateOpen, setDateOpen] = useState(false)
  const [ivaPercentInput, setIvaPercentInput] = useState<number>(defaultIvaPercent)

  // Reforma Tributária
  const fiscalConfig = systemSettings?.fiscalConfig
  const defaultCbs = fiscalConfig?.cbsAliquota ?? 0.9
  const defaultIbs = fiscalConfig?.ibsAliquota ?? 0.1
  const defaultApplySplit = fiscalConfig?.applySplitPayment ?? true

  const [isFiscalDoc, setIsFiscalDoc] = useState(false)
  const [fiscalRegime, setFiscalRegime] = useState<FiscalRegime>('caixa')
  const [cbsRate, setCbsRate] = useState<number>(defaultCbs)
  const [ibsRate, setIbsRate] = useState<number>(defaultIbs)
  const [applySplit, setApplySplit] = useState<boolean>(defaultApplySplit)

  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('Mensal')
  const [occurrences, setOccurrences] = useState('2')

  useEffect(() => {
    if (open) {
      fetchContas()
      if (transactionToEdit) {
        setFormData({
          type: transactionToEdit.type,
          status: transactionToEdit.status,
          description: transactionToEdit.description,
          amount: transactionToEdit.amount,
          category: transactionToEdit.category,
          date: transactionToEdit.date,
          conta_id: transactionToEdit.conta_id || '',
          recibo_id: transactionToEdit.recibo_id || '',
        })
        const valToDisplay =
          transactionToEdit.type === 'Receita' && transactionToEdit.amount_bruto !== undefined
            ? transactionToEdit.amount_bruto
            : transactionToEdit.amount
        setDisplayAmount(formatCurrencyInput(Math.round((valToDisplay || 0) * 100).toString()))
        setIvaPercentInput(
          transactionToEdit.iva_percent !== undefined
            ? transactionToEdit.iva_percent
            : defaultIvaPercent,
        )
        setIsFiscalDoc(Boolean(transactionToEdit.emits_fiscal_doc))
        setFiscalRegime(transactionToEdit.fiscal_regime || 'caixa')
        setCbsRate(
          transactionToEdit.cbs_aliquota !== undefined
            ? transactionToEdit.cbs_aliquota
            : defaultCbs,
        )
        setIbsRate(
          transactionToEdit.ibs_aliquota !== undefined
            ? transactionToEdit.ibs_aliquota
            : defaultIbs,
        )
        setApplySplit(
          transactionToEdit.split_payment_applied !== undefined
            ? Boolean(transactionToEdit.split_payment_applied)
            : defaultApplySplit,
        )
        setIsRecurring(false)
      } else {
        setFormData({
          type: defaultType,
          status: 'Pendente',
          description: '',
          amount: undefined,
          category: defaultType === 'Receita' ? services[0] : expenseCategories[0],
          date: new Date().toISOString().split('T')[0],
          conta_id: contas.length > 0 ? contas[0].id : '',
          recibo_id: '',
        })
        setDisplayAmount('')
        setIvaPercentInput(defaultIvaPercent)
        setIsFiscalDoc(defaultType === 'Receita')
        setFiscalRegime('caixa')
        setCbsRate(defaultCbs)
        setIbsRate(defaultIbs)
        setApplySplit(defaultApplySplit)
        setIsRecurring(false)
        setFrequency('Mensal')
        setOccurrences('2')
      }
    }
  }, [
    open,
    defaultType,
    transactionToEdit,
    services,
    expenseCategories,
    defaultCbs,
    defaultIbs,
    defaultApplySplit,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.description ||
      formData.amount === undefined ||
      !formData.date ||
      !formData.category
    ) {
      toast({
        title: 'Atenção',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const isReceita = formData.type === 'Receita'
    const isLinkedToRecibo = Boolean(formData.recibo_id)

    let gross = Number(formData.amount) || 0
    let percent = isReceita && !isLinkedToRecibo ? Number(ivaPercentInput || 0) : 0
    let ivaAmt =
      isReceita && !isLinkedToRecibo ? Math.round(((gross * percent) / 100) * 100) / 100 : 0

    // Reforma Tributária: CBS / IBS / Split Payment
    const mode = fiscalConfig?.operationMode || 'teste_2026'
    const isTeste2026 = mode === 'teste_2026'
    const cbsAmt =
      isReceita && isFiscalDoc ? Math.round(((gross * (cbsRate || 0)) / 100) * 100) / 100 : 0
    const ibsAmt =
      isReceita && isFiscalDoc ? Math.round(((gross * (ibsRate || 0)) / 100) * 100) / 100 : 0
    const totalFiscalTax = cbsAmt + ibsAmt
    // Se ano-teste: não há retenção de split payment nem desconto efetivo do imposto no caixa
    const splitAmt = isReceita && isFiscalDoc && applySplit && !isTeste2026 ? totalFiscalTax : 0
    const net = isReceita ? (splitAmt > 0 ? gross - splitAmt : gross - ivaAmt) : gross

    const payload: Partial<Transaction> = {
      description: formData.description,
      amount: isReceita ? net : gross,
      type: formData.type,
      status: formData.status,
      category: formData.category,
      conta_id: formData.conta_id,
      date: new Date(formData.date + 'T00:00:00').toISOString(),
      amount_bruto: isReceita ? gross : gross,
      iva_percent: percent,
      iva_amount: ivaAmt,
      amount_net: isReceita ? net : gross,
      emits_fiscal_doc: isReceita ? isFiscalDoc : false,
      fiscal_regime: isReceita ? fiscalRegime : undefined,
      cbs_aliquota: isReceita && isFiscalDoc ? cbsRate : 0,
      cbs_amount: cbsAmt,
      ibs_aliquota: isReceita && isFiscalDoc ? ibsRate : 0,
      ibs_amount: ibsAmt,
      split_payment_applied: isReceita && isFiscalDoc ? applySplit : false,
      split_payment_amount: splitAmt,
    }

    try {
      if (transactionToEdit) {
        const { id, created, updated, expand, collectionId, collectionName, ...safePayload } =
          payload as any
        await updateTransaction(transactionToEdit.id, safePayload as Transaction)
        toast({ title: 'Sucesso', description: 'Transação atualizada com sucesso na nuvem.' })
      } else {
        if (isRecurring) {
          const N = parseInt(occurrences, 10) || 2
          const txs: Partial<Transaction>[] = []
          let curDate = new Date(formData.date + 'T00:00:00')

          for (let i = 0; i < N; i++) {
            txs.push({
              ...payload,
              date: curDate.toISOString(),
            } as Transaction)

            if (frequency === 'Mensal') {
              curDate.setMonth(curDate.getMonth() + 1)
            } else if (frequency === 'Trimestral') {
              curDate.setMonth(curDate.getMonth() + 3)
            } else if (frequency === 'Anual') {
              curDate.setFullYear(curDate.getFullYear() + 1)
            }
          }
          await addTransactions(txs)
          toast({
            title: 'Sucesso',
            description: `${N} transações foram geradas na nuvem.`,
          })
        } else {
          await addTransaction(payload as Transaction)
          toast({ title: 'Sucesso', description: 'A transação foi salva com sucesso na nuvem.' })
        }
      }

      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro de Conexão', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setDisplayAmount(formatted)
    setFormData({ ...formData, amount: parseCurrencyInput(e.target.value) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit
              ? formData.type === 'Receita'
                ? 'Editar Receita'
                : 'Editar Despesa'
              : formData.type === 'Receita'
                ? 'Nova Receita'
                : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>

        {transactionToEdit ? (
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="dados">Dados da Transação</TabsTrigger>
              <TabsTrigger value="auditoria">Histórico de Alterações</TabsTrigger>
            </TabsList>

            <TabsContent value="dados">
              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => {
                        const newType = v as TransactionType
                        setFormData({
                          ...formData,
                          type: newType,
                          category: newType === 'Receita' ? services[0] : expenseCategories[0],
                        })
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as TransactionStatus })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    className="h-9 text-sm"
                    required
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Categoria / Subcategoria</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'Receita' &&
                        services
                          .filter((s) => s && s.trim() !== '')
                          .map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                      {formData.type === 'Despesa' &&
                        expenseCategories
                          .filter((s) => s && s.trim() !== '')
                          .map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                      {((formData.type === 'Receita' &&
                        services.filter((s) => s && s.trim() !== '').length === 0) ||
                        (formData.type === 'Despesa' &&
                          expenseCategories.filter((s) => s && s.trim() !== '').length === 0)) && (
                        <SelectItem value="__no_category" disabled>
                          Nenhuma categoria disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Conta Financeira</Label>
                  <Select
                    value={formData.conta_id || ''}
                    onValueChange={(v) => setFormData({ ...formData, conta_id: v })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.length === 0 ? (
                        <SelectItem value="__no_contas" disabled>
                          Nenhuma conta cadastrada
                        </SelectItem>
                      ) : (
                        contas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Data</Label>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-9 text-sm justify-start text-left font-normal',
                            !formData.date && 'text-muted-foreground',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? (
                            new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR')
                          ) : (
                            <span>Selecionar</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            formData.date ? new Date(formData.date + 'T00:00:00') : undefined
                          }
                          onSelect={(d) => {
                            if (d) {
                              setFormData({ ...formData, date: d.toISOString().split('T')[0] })
                              setDateOpen(false)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      {formData.type === 'Receita' ? 'Valor Bruto' : 'Valor'}
                    </Label>
                    <Input
                      className="h-9 text-sm font-semibold"
                      type="text"
                      required
                      value={displayAmount}
                      onChange={handleAmountChange}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                {formData.type === 'Receita' && (
                  <TransactionFiscalFields
                    grossAmount={formData.amount || 0}
                    fiscalConfig={fiscalConfig}
                    isFiscalDoc={isFiscalDoc}
                    setIsFiscalDoc={setIsFiscalDoc}
                    regime={fiscalRegime}
                    setRegime={setFiscalRegime}
                    cbsRate={cbsRate}
                    setCbsRate={setCbsRate}
                    ibsRate={ibsRate}
                    setIbsRate={setIbsRate}
                    applySplit={applySplit}
                    setApplySplit={setApplySplit}
                  />
                )}

                <Button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full mt-4 bg-primary hover:bg-secondary text-primary-foreground font-semibold"
                >
                  {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar Alterações
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="auditoria" className="pt-1">
              <TransactionAuditTimeline transactionId={transactionToEdit.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => {
                    const newType = v as TransactionType
                    setFormData({
                      ...formData,
                      type: newType,
                      category: newType === 'Receita' ? services[0] : expenseCategories[0],
                    })
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as TransactionStatus })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Descrição</Label>
              <Input
                className="h-9 text-sm"
                required
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Categoria / Subcategoria</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'Receita' &&
                    services
                      .filter((s) => s && s.trim() !== '')
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  {formData.type === 'Despesa' &&
                    expenseCategories
                      .filter((s) => s && s.trim() !== '')
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  {((formData.type === 'Receita' &&
                    services.filter((s) => s && s.trim() !== '').length === 0) ||
                    (formData.type === 'Despesa' &&
                      expenseCategories.filter((s) => s && s.trim() !== '').length === 0)) && (
                    <SelectItem value="__no_category" disabled>
                      Nenhuma categoria disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Conta Financeira</Label>
              <Select
                value={formData.conta_id || ''}
                onValueChange={(v) => setFormData({ ...formData, conta_id: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.length === 0 ? (
                    <SelectItem value="__no_contas" disabled>
                      Nenhuma conta cadastrada
                    </SelectItem>
                  ) : (
                    contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Data</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full h-9 text-sm justify-start text-left font-normal',
                        !formData.date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR')
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                      onSelect={(d) => {
                        if (d) {
                          setFormData({ ...formData, date: d.toISOString().split('T')[0] })
                          setDateOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  {formData.type === 'Receita' ? 'Valor Bruto' : 'Valor'}
                </Label>
                <Input
                  className="h-9 text-sm font-semibold"
                  type="text"
                  required
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            {formData.type === 'Receita' && (
              <TransactionFiscalFields
                grossAmount={formData.amount || 0}
                fiscalConfig={fiscalConfig}
                isFiscalDoc={isFiscalDoc}
                setIsFiscalDoc={setIsFiscalDoc}
                regime={fiscalRegime}
                setRegime={setFiscalRegime}
                cbsRate={cbsRate}
                setCbsRate={setCbsRate}
                ibsRate={ibsRate}
                setIbsRate={setIbsRate}
                applySplit={applySplit}
                setApplySplit={setApplySplit}
              />
            )}

            {!transactionToEdit && (
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <Label
                    className="text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsRecurring(!isRecurring)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-primary" /> Lançamento Recorrente
                  </Label>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>
                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Frequência</Label>
                      <Select value={frequency} onValueChange={(v) => setFrequency(v)}>
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                          <SelectItem value="Trimestral">Trimestral</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Total de Ocorrências</Label>
                      <Input
                        type="number"
                        min={2}
                        max={120}
                        value={occurrences}
                        onChange={(e) => setOccurrences(e.target.value)}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSyncing}
              className="w-full mt-4 bg-primary hover:bg-secondary text-primary-foreground font-semibold"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Transação
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
