import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

export default function Configuracoes() {
  const {
    companies,
    banks,
    services,
    addCompany,
    removeCompany,
    addBank,
    removeBank,
    addService,
    removeService,
  } = useMainStore()

  const [newCompany, setNewCompany] = useState('')
  const [newBank, setNewBank] = useState('')
  const [newService, setNewService] = useState('')

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      addCompany(newCompany.trim())
      setNewCompany('')
    }
  }
  const handleAddBank = () => {
    if (newBank.trim()) {
      addBank(newBank.trim())
      setNewBank('')
    }
  }
  const handleAddService = () => {
    if (newService.trim()) {
      addService(newService.trim())
      setNewService('')
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ConfigSection
          title="Empresas (Filtros e Cadastros)"
          items={companies}
          onAdd={handleAddCompany}
          onRemove={removeCompany}
          value={newCompany}
          setValue={setNewCompany}
        />
        <ConfigSection
          title="Bancos Integrados"
          items={banks}
          onAdd={handleAddBank}
          onRemove={removeBank}
          value={newBank}
          setValue={setNewBank}
        />
        <ConfigSection
          title="Serviços Oferecidos"
          items={services}
          onAdd={handleAddService}
          onRemove={removeService}
          value={newService}
          setValue={setNewService}
        />
      </div>
    </div>
  )
}

interface ConfigSectionProps {
  title: string
  items: string[]
  onAdd: () => void
  onRemove: (item: string) => void
  value: string
  setValue: (val: string) => void
}

function ConfigSection({ title, items, onAdd, onRemove, value, setValue }: ConfigSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex space-x-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Adicionar novo..."
            className="text-xs h-9"
          />
          <Button onClick={onAdd} size="icon" className="h-9 w-9 bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 text-accent-foreground" />
          </Button>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded-md text-xs font-medium border border-border/50"
            >
              <span>{item}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item)}
                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-xs text-muted-foreground text-center py-2">
              Nenhum item cadastrado
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
