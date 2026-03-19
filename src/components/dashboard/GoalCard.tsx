import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Check, Target } from 'lucide-react'
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'

interface GoalCardProps {
  current: number
  goal: number
  onUpdateGoal: (val: number) => void
}

export function GoalCard({ current, goal, onUpdateGoal }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editVal, setEditVal] = useState('')

  const percentage = Math.min(Math.round((current / (goal || 1)) * 100), 100)

  const handleSave = () => {
    const num = parseCurrencyInput(editVal)
    if (num !== undefined) onUpdateGoal(num)
    setIsEditing(false)
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Faturamento (Mês)
            </h3>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(current)}
            </div>
          </div>
        </div>

        <div className="mb-3">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editVal}
                onChange={(e) => setEditVal(formatCurrencyInput(e.target.value))}
                className="h-8 text-xs font-mono w-full"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleSave}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
              <span className="font-medium">Meta: {formatCurrency(goal)}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-muted shrink-0"
                onClick={() => {
                  setEditVal(formatCurrencyInput(Math.round(goal * 100).toString()))
                  setIsEditing(true)
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right font-medium">
            {percentage}% alcançado
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
