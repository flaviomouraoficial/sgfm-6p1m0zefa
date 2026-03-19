import { Button } from '@/components/ui/button'
import { TransactionType } from '@/lib/types'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface Props {
  selected: TransactionType
  onSelect: (t: TransactionType) => void
  onNext: () => void
}

export function ImportTypeStep({ selected, onSelect, onNext }: Props) {
  return (
    <div className="space-y-6 pt-2 animate-fade-in-up">
      <div className="text-sm text-muted-foreground mb-4">
        Selecione o tipo de transação que deseja importar:
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('Despesa')}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
            selected === 'Despesa'
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-muted hover:border-destructive/50 hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          <ArrowDownCircle className="w-8 h-8" />
          <span className="font-semibold">Contas a Pagar</span>
        </button>
        <button
          onClick={() => onSelect('Receita')}
          className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
            selected === 'Receita'
              ? 'border-green-600 bg-green-600/10 text-green-600'
              : 'border-muted hover:border-green-600/50 hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          <ArrowUpCircle className="w-8 h-8" />
          <span className="font-semibold">Contas a Receber</span>
        </button>
      </div>
      <div className="flex justify-end mt-8">
        <Button onClick={onNext}>Continuar</Button>
      </div>
    </div>
  )
}
