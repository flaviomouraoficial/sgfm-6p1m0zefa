import { createPortal } from 'react-dom'
import { Recibo } from '@/lib/types'
import { format } from 'date-fns'

export function ReceiptPrint({ recibo }: { recibo: Recibo }) {
  const formatMoney = (val: number | undefined) =>
    val !== undefined ? `R$ ${val.toFixed(2).replace('.', ',')}` : '-'

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy')
    } catch {
      return dateStr
    }
  }

  const content = (
    <div className="print-only font-sans text-slate-800 bg-white" style={{ color: '#1f2937' }}>
      <div className="max-w-[210mm] mx-auto p-8 bg-white min-h-[297mm]">
        <div
          className="bg-[#288f87] text-white rounded-lg p-6 flex justify-between items-center mb-8"
          style={{ backgroundColor: '#288f87' }}
        >
          <div>
            <h1 className="text-2xl font-bold mb-1">Trend Consultoria LTDA</h1>
            <p className="text-sm opacity-90 font-medium">CNPJ: 09.465.223/0001-07</p>
          </div>
          <div
            className="w-14 h-14 bg-white/20 rounded flex items-center justify-center border border-white/30"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[#288f87] text-2xl font-bold uppercase" style={{ color: '#288f87' }}>
            Recibo de Despesa de Viagem
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Período: {formatDate(recibo.data_criacao)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-slate-200 rounded-lg p-5 shadow-sm bg-white">
            <h3 className="text-[#288f87] font-bold text-lg mb-4" style={{ color: '#288f87' }}>
              Dados do Recibo
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Número:</span> {recibo.numero}
              </p>
              <p>
                <span className="font-bold">Status:</span> {recibo.status}
              </p>
              <p>
                <span className="font-bold">Data da Criação:</span>{' '}
                {formatDate(recibo.data_criacao)}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 shadow-sm bg-white">
            <h3 className="text-[#288f87] font-bold text-lg mb-4" style={{ color: '#288f87' }}>
              Dados do Cliente
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Nome:</span> {recibo.cliente_nome}
              </p>
              <p>
                <span className="font-bold">Documento:</span> {recibo.cliente_documento || '-'}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 shadow-sm bg-white">
            <h3 className="text-[#288f87] font-bold text-lg mb-4" style={{ color: '#288f87' }}>
              Dados da Nota Fiscal (NF)
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Número NF:</span> {recibo.nf_numero || '-'}
              </p>
              <p>
                <span className="font-bold">Data NF:</span> {formatDate(recibo.nf_data)}
              </p>
              <p>
                <span className="font-bold">Descrição:</span> {recibo.nf_descricao || '-'}
              </p>
              <p>
                <span className="font-bold">Valor Total NF:</span>{' '}
                {formatMoney(recibo.nf_valor_total)}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 shadow-sm bg-white">
            <h3 className="text-[#288f87] font-bold text-lg mb-4" style={{ color: '#288f87' }}>
              Dados Bancários para Reembolso
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold">Banco:</span> {recibo.banco || '-'}
              </p>
              <p>
                <span className="font-bold">Agência/Conta:</span> {recibo.agencia_conta || '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-[#288f87] font-bold text-lg mb-4" style={{ color: '#288f87' }}>
            Itens de Despesa
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#288f87] text-white" style={{ backgroundColor: '#288f87' }}>
              <tr>
                <th className="text-left py-3 px-4 font-bold border-b border-[#288f87]">
                  Descrição
                </th>
                <th className="text-center py-3 px-4 font-bold w-24 border-b border-[#288f87]">
                  Qtd
                </th>
                <th className="text-right py-3 px-4 font-bold w-32 border-b border-[#288f87]">
                  V. Unitário
                </th>
                <th className="text-right py-3 px-4 font-bold w-32 border-b border-[#288f87]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              {recibo.itens?.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-3 px-4">{item.descricao}</td>
                  <td className="text-center py-3 px-4">{item.qtd}</td>
                  <td className="text-right py-3 px-4">{formatMoney(item.valor_unitario)}</td>
                  <td className="text-right py-3 px-4">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#288f87] text-white" style={{ backgroundColor: '#288f87' }}>
                <td colSpan={3} className="text-right py-3 px-4 font-bold">
                  Subtotal Itens:
                </td>
                <td className="text-right py-3 px-4 font-bold">{formatMoney(recibo.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
