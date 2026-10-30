import React from 'react'
import { VendaMaterial, VendaMaterialItem, Empresa } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Printer, X, Package } from 'lucide-react'

interface EtiquetaEnvioPrintProps {
  venda: VendaMaterial
  empresa?: Empresa
  onClose: () => void
}

export function EtiquetaEnvioPrint({ venda, empresa, onClose }: EtiquetaEnvioPrintProps) {
  const handlePrint = () => {
    window.print()
  }

  const itensArray: VendaMaterialItem[] = Array.isArray(venda.itens_json) ? venda.itens_json : []
  const totalVolumes = itensArray.reduce((acc, it) => acc + (it.quantidade || 0), 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none">
        {/* Barra superior de ações */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Package className="w-4 h-4 text-primary" />
            <span>Etiqueta de Envio / Despacho</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Etiqueta
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" /> Fechar
            </Button>
          </div>
        </div>

        {/* Etiqueta Padrão de Despacho (10x15cm / Box destacado) */}
        <div className="p-8 space-y-6 bg-white" id="etiqueta-envio-content">
          <div className="border-2 border-black rounded-xl p-5 space-y-4">
            {/* Header da Etiqueta */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                  Declaração de Conteúdo / Envio
                </span>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  ENCOMENDA EXPRESSA
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold block">{venda.numero_pedido}</span>
                {venda.nf_numero && (
                  <span className="text-[10px] font-mono text-slate-600 block">
                    NF: {venda.nf_numero}
                  </span>
                )}
              </div>
            </div>

            {/* DESTINATÁRIO (Em destaque) */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-600 block">
                DESTINATÁRIO:
              </span>
              <p className="text-base font-black text-slate-900 leading-tight">
                {venda.cliente_nome || 'Cliente do Sistema'}
              </p>
              {venda.cliente_documento && (
                <p className="text-xs font-mono text-slate-700">Doc: {venda.cliente_documento}</p>
              )}
              <p className="text-xs text-slate-800 font-medium pt-1">
                {venda.cliente_endereco || 'Endereço a confirmar / Retirada em mãos'}
              </p>
            </div>

            {/* REMETENTE */}
            <div className="text-xs text-slate-700 space-y-0.5 pt-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                REMETENTE:
              </span>
              <p className="font-bold text-slate-900">{empresa?.nome || 'Trend Consultoria'}</p>
              <p className="font-mono text-[11px]">CNPJ: {empresa?.cnpj || '09.465.223/0001-07'}</p>
              {empresa?.cidade && (
                <p className="text-[11px] text-slate-600">
                  {empresa.cidade} - {empresa.estado || 'PR'}
                </p>
              )}
            </div>

            {/* RESUMO DOS MATERIAIS */}
            <div className="border-t border-slate-300 pt-2 text-[11px]">
              <span className="font-bold text-slate-600 block mb-1">
                Conteúdo ({totalVolumes} unidade{totalVolumes > 1 ? 's' : ''}):
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                {itensArray.map((it, idx) => (
                  <li key={idx} className="truncate">
                    {it.quantidade}x {it.descricao}
                  </li>
                ))}
              </ul>
            </div>

            {/* Código de barras simulado / Rodapé */}
            <div className="border-t-2 border-black pt-3 flex flex-col items-center justify-center space-y-1">
              <div className="font-mono tracking-[0.3em] font-black text-xl text-black">
                *{venda.numero_pedido.replace(/[^a-zA-Z0-9]/g, '')}*
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                Controle Logístico SGFM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
