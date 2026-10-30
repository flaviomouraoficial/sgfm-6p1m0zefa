import React, { useEffect } from 'react'
import { useMainStore } from '@/stores/main'
import { Building2, Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function CompanySelector() {
  const { empresas, selectedEmpresaId, setSelectedEmpresaId, fetchEmpresas } = useMainStore()

  useEffect(() => {
    if (empresas.length === 0) {
      fetchEmpresas()
    }
  }, [empresas.length, fetchEmpresas])

  const selectedEmpresa = empresas.find((e) => e.id === selectedEmpresaId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-black/60 border-white/20 text-white hover:bg-white/10 hover:text-white flex items-center gap-2 max-w-[260px] h-9 px-3 rounded-lg shadow-inner"
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor:
                selectedEmpresa?.cor_identificacao ||
                (selectedEmpresaId === 'todas' ? '#a855f7' : '#288f87'),
            }}
          />
          <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-semibold truncate leading-tight">
              {selectedEmpresa ? selectedEmpresa.nome : 'Todas as Empresas (Consolidado)'}
            </span>
            {selectedEmpresa?.cnpj && (
              <span className="text-[10px] text-slate-400 font-mono truncate leading-none">
                {selectedEmpresa.cnpj}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-popover text-popover-foreground shadow-xl border border-border"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Empresa / CNPJ Ativo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setSelectedEmpresaId('todas')}
          className="flex items-center justify-between cursor-pointer py-2.5"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium leading-tight">Visão Consolidada</span>
              <span className="text-xs text-muted-foreground">Todos os CNPJs juntos</span>
            </div>
          </div>
          {selectedEmpresaId === 'todas' && (
            <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {empresas.map((empresa) => (
          <DropdownMenuItem
            key={empresa.id}
            onClick={() => setSelectedEmpresaId(empresa.id)}
            className="flex items-center justify-between cursor-pointer py-2.5"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: empresa.cor_identificacao || '#288f87' }}
              />
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate leading-tight">
                    {empresa.nome}
                  </span>
                  {empresa.is_principal && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary"
                    >
                      Matriz
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {empresa.cnpj}
                </span>
              </div>
            </div>
            {selectedEmpresaId === empresa.id && (
              <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
