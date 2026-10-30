import React from 'react'
import { VendaMaterial, VendaMaterialItem, Empresa } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { TREND_LOGO_URL } from '@/lib/trendPdf'

interface ReciboEntregaPrintProps {
  venda: VendaMaterial
  empresa?: Empresa
  onClose: () => void
}

export function ReciboEntregaPrint({ venda, empresa, onClose }: ReciboEntregaPrintProps) {
  const handlePrint = () => {
    window.print()
  }

  const itensArray: VendaMaterialItem[] = Array.isArray(venda.itens_json) ? venda.itens_json : []
  const dataFormatada = venda.data_venda
    ? new Date(venda.data_venda).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('pt-BR')

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-black w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none">
        {/* Barra superior de ações (oculta na impressão) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span>Visualização de Impressão — Recibo de Entrega (A4)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Documento
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

        {/* Conteúdo do Recibo no Padrão A4 */}
        <div className="p-10 space-y-8 bg-white print:p-8" id="recibo-entrega-content">
          {/* Cabeçalho da Empresa */}
          <div className="flex items-center justify-between border-b pb-6 border-slate-200">
            <div className="flex items-center gap-4">
              <img
                src={TREND_LOGO_URL}
                alt="Logo"
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  ;(e.target as any).style.display = 'none'
                }}
              />
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                  {empresa?.nome || 'Trend Consultoria'}
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  CNPJ: {empresa?.cnpj || '09.465.223/0001-07'}
                </p>
                {empresa?.cidade && (
                  <p className="text-xs text-slate-500">
                    {empresa.cidade} - {empresa.estado || 'PR'}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 rounded px-3 py-1.5 text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Recibo de Entrega
                </span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {venda.numero_pedido}
                </span>
              </div>
              {venda.nf_numero && (
                <div className="text-[11px] font-mono text-slate-600 mt-1">
                  NF Ref: {venda.nf_numero}
                </div>
              )}
            </div>
          </div>

          {/* Dados do Cliente / Destinatário */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Destinatário / Cliente
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {venda.cliente_nome || 'Cliente do Sistema'}
              </p>
              {venda.cliente_documento && (
                <p className="text-slate-600 font-mono mt-0.5">
                  CPF/CNPJ: {venda.cliente_documento}
                </p>
              )}
            </div>
            <div>
              <span className="block font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Endereço de Entrega
              </span>
              <p className="text-slate-800 mt-0.5">
                {venda.cliente_endereco || 'Retirada em mãos / Presencial'}
              </p>
              <p className="text-slate-500 mt-1">Data do Pedido: {dataFormatada}</p>
            </div>
          </div>

          {/* Tabela de Itens Entregues */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Discriminação dos Livros & Materiais Entregues
            </h2>
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item / Código</th>
                  <th className="py-2.5 px-3">Descrição do Material</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {itensArray.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {it.codigo || `ITEM-${idx + 1}`}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{it.descricao}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {it.quantidade}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(it.preco_unitario)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(venda.subtotal)}</span>
              </div>
              {venda.desconto > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto Concedido:</span>
                  <span className="font-mono">-{formatCurrency(venda.desconto)}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                <span>Valor Total:</span>
                <span className="font-mono">{formatCurrency(venda.valor_total)}</span>
              </div>
              <div className="text-[10px] text-slate-500 text-right">
                Forma de Pagamento: {venda.forma_pagamento || 'PIX'}
              </div>
            </div>
          </div>

          {venda.observacoes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <strong>Observações:</strong> {venda.observacoes}
            </div>
          )}

          {/* Termo de Recebimento e Assinaturas */}
          <div className="pt-10 space-y-10 border-t border-slate-200">
            <p className="text-xs text-slate-600 text-justify leading-relaxed">
              Declaro que recebi em perfeitas condições os materiais/livros descritos acima,
              isentando o remetente de quaisquer avarias ou vícios aparentes a partir da presente
              data.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="text-center space-y-1">
                <div className="border-b border-slate-400 w-full mb-1" />
                <span className="block text-xs font-bold text-slate-900">
                  {empresa?.nome || 'Trend Consultoria'}
                </span>
                <span className="block text-[10px] text-slate-500">
                  Responsável pela Entrega / Expedição
                </span>
              </div>
              <div className="text-center space-y-1">
                <div className="border-b border-slate-400 w-full mb-1" />
                <span className="block text-xs font-bold text-slate-900">
                  {venda.cliente_nome || 'Destinatário'}
                </span>
                <span className="block text-[10px] text-slate-500">
                  Assinatura do Recebedor — Data: ___/___/______
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
