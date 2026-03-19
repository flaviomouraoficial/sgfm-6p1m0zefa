import { Transaction } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: Transaction[]
  company: string
  periodLabel: string
  receitas: number
  despesas: number
  saldo: number
}

export function ReportPDF({ data, company, periodLabel, receitas, despesas, saldo }: Props) {
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return (
    <div className="hidden print:block print:bg-white print:text-black print:min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {company === 'Todas' ? 'Consolidado Geral' : company}
          </h1>
          <p className="text-lg text-gray-500 mt-1">Relatório Financeiro Gerencial</p>
        </div>
        <div className="text-right bg-gray-50 p-4 rounded-lg border border-gray-100">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Período Selecionado
          </p>
          <p className="text-lg font-medium text-gray-900">{periodLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Receitas (Pagas)
          </p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(receitas)}</p>
        </div>
        <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Despesas (Pagas)
          </p>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(despesas)}</p>
        </div>
        <div className="p-6 border-2 border-gray-900 rounded-xl bg-gray-50 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">
            Saldo Líquido
          </p>
          <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
          Detalhamento de Movimentações
        </h2>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="py-3 px-4 font-semibold text-gray-700">Data</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Descrição</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Categoria/Serviço</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 font-semibold text-gray-700 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  Nenhuma movimentação no período.
                </td>
              </tr>
            ) : (
              sortedData.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {t.description}
                    <div className="text-xs text-gray-500 mt-0.5">
                      {isReceita(t) ? t.client : t.supplier}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {isReceita(t) ? t.service : t.category}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'Pago' ? 'bg-gray-200 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${isReceita(t) ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isReceita(t) ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
        Relatório gerado pelo Sistema de Gestão Financeira em {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

function isReceita(t: Transaction) {
  return t.type === 'Receita'
}
