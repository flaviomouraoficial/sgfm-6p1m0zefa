import React, { useState } from 'react'
import { ContratosPage } from './Contratos'
import { PainelContratosList } from '@/components/contratos/PainelContratosList'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, PlusCircle, List } from 'lucide-react'

export function ContratosMainPage() {
  const [activeTab, setActiveTab] = useState<'gerador' | 'painel'>('gerador')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'gerador' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('gerador')}
            className="text-xs gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Gerador de Contrato (Wizard)
          </Button>
          <Button
            variant={activeTab === 'painel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('painel')}
            className="text-xs gap-1.5"
          >
            <List className="w-3.5 h-3.5" /> Painel de Contratos Gerados
          </Button>
        </div>
      </div>

      {activeTab === 'gerador' ? (
        <ContratosPage />
      ) : (
        <PainelContratosList onNovoContrato={() => setActiveTab('gerador')} />
      )}
    </div>
  )
}
