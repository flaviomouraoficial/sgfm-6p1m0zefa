import { createPortal } from 'react-dom'
import { Recibo } from '@/lib/types'
import { format } from 'date-fns'
import { TREND_LOGO_URL } from '@/lib/trendPdf'

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
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #receipt-print-container, #receipt-print-container * { visibility: visible; }
          #receipt-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            min-height: 100vh;
          }
          /* Moldura de 12mm com logotipo fixo da Trend no canto superior esquerdo */
          #receipt-print-container .recibo-moldura {
            position: relative;
            padding: 12mm;
            min-height: 297mm;
            box-sizing: border-box;
          }
          #receipt-print-container .trend-corner-logo {
            position: absolute;
            top: 14mm;
            left: 14mm;
            height: 14mm;
            width: auto;
            max-width: 42mm;
            object-fit: contain;
            z-index: 50;
            display: block;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `}
      </style>
      <div
        id="receipt-print-container"
        className="font-sans text-slate-800 bg-white p-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="max-w-[210mm] mx-auto bg-white recibo-moldura">
          {/* Logotipo fixo da Trend Consultoria no canto superior esquerdo da moldura de 12mm */}
          <img src={TREND_LOGO_URL} alt="Trend Consultoria" className="trend-corner-logo" />
          <div
            className="rounded-lg p-6 flex justify-between items-center mb-8 mt-8"
            style={{ backgroundColor: '#288f87', color: '#ffffff' }}
          >
            <div>
              <h1 className="text-2xl font-bold mb-1">Trend Consultoria LTDA</h1>
              <p className="text-sm opacity-90 font-medium">CNPJ 09.465.223/0001-07</p>
            </div>
            <div>
              <img
                src="https://img.usecurling.com/i?q=office%20building&color=multicolor&shape=fill"
                alt="Company Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold uppercase" style={{ color: '#288f87' }}>
              RECIBO GERADO
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Data de Emissão: {formatDate(recibo.data_criacao)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h3
                className="font-bold text-lg mb-3 pb-2 border-b border-slate-100"
                style={{ color: '#288f87' }}
              >
                Dados do Recibo
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="font-bold">Número:</span> {recibo.numero}
                </p>
                <p>
                  <span className="font-bold">Status:</span> {recibo.status?.toUpperCase() || '-'}
                </p>
                <p>
                  <span className="font-bold">Data da Criação:</span>{' '}
                  {formatDate(recibo.data_criacao)}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h3
                className="font-bold text-lg mb-3 pb-2 border-b border-slate-100"
                style={{ color: '#288f87' }}
              >
                Dados do Cliente
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="font-bold">Nome:</span> {recibo.cliente_nome}
                </p>
                <p>
                  <span className="font-bold">Documento:</span> {recibo.cliente_documento || '-'}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h3
                className="font-bold text-lg mb-3 pb-2 border-b border-slate-100"
                style={{ color: '#288f87' }}
              >
                Dados da Nota Fiscal (NF)
              </h3>
              <div className="space-y-1.5 text-sm">
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

            <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm">
              <h3
                className="font-bold text-lg mb-3 pb-2 border-b border-slate-100"
                style={{ color: '#288f87' }}
              >
                Dados Bancários para Reembolso
              </h3>
              <div className="space-y-1.5 text-sm">
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
            <h3 className="font-bold text-lg mb-4" style={{ color: '#288f87' }}>
              Itens de Despesa
            </h3>
            <table className="w-full text-sm border-collapse">
              <thead style={{ backgroundColor: '#288f87', color: '#ffffff' }}>
                <tr>
                  <th className="text-left py-2.5 px-4 font-bold border-b border-[#288f87]">
                    Descrição
                  </th>
                  <th className="text-center py-2.5 px-4 font-bold w-24 border-b border-[#288f87]">
                    Qtd
                  </th>
                  <th className="text-right py-2.5 px-4 font-bold w-32 border-b border-[#288f87]">
                    V. Unitário
                  </th>
                  <th className="text-right py-2.5 px-4 font-bold w-32 border-b border-[#288f87]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="border-b border-slate-200">
                {recibo.itens?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2.5 px-4">{item.descricao}</td>
                    <td className="text-center py-2.5 px-4">{item.qtd}</td>
                    <td className="text-right py-2.5 px-4">{formatMoney(item.valor_unitario)}</td>
                    <td className="text-right py-2.5 px-4">{formatMoney(item.total)}</td>
                  </tr>
                ))}
                {(!recibo.itens || recibo.itens.length === 0) && (
                  <tr className="bg-white">
                    <td colSpan={4} className="py-4 px-4 text-center text-slate-500">
                      Nenhum item adicionado.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#288f87', color: '#ffffff' }}>
                  <td colSpan={3} className="text-right py-2.5 px-4 font-bold">
                    Subtotal Itens:
                  </td>
                  <td className="text-right py-2.5 px-4 font-bold">
                    {formatMoney(recibo.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
