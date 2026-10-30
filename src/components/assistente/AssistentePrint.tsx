import React from 'react'
import { createPortal } from 'react-dom'
import {
  MeetingFormData,
  RecommendationTier,
  TABLES,
  CommercialTableItem,
  formatRevenueLabel,
  formatUrgencyLabel,
  formatHistoryLabel,
  formatLiquidityLabel,
  formatReadinessLabel,
  buildMeetingSummary,
  PainItem,
  ObjectionItem,
} from '@/lib/assistente-comercial-data'
import { formatCurrency } from '@/lib/utils'
import { TREND_LOGO_URL } from '@/lib/trendPdf'

export interface AssistentePrintProps {
  formData: MeetingFormData
  tier: RecommendationTier
  productName: string
  price: number
  tableKey: string
  pains: PainItem[]
  objections: ObjectionItem[]
  summaryText?: string
}

export const AssistentePrint: React.FC<AssistentePrintProps> = ({
  formData,
  tier,
  productName,
  price,
  tableKey,
  pains,
  objections,
  summaryText,
}) => {
  const tableRows: CommercialTableItem[] = TABLES[tableKey] || TABLES.diag
  const fullSummary = summaryText || buildMeetingSummary(formData, tier, formatCurrency)
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const content = (
    <>
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 12mm 15mm 15mm 15mm;
          }

          body * {
            visibility: hidden !important;
          }

          #assistente-comercial-print,
          #assistente-comercial-print * {
            visibility: visible !important;
          }

          #assistente-comercial-print {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 14px !important;
          }

          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 8px !important;
            font-size: 9.5pt !important;
          }

          .print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
          }

          .print-card {
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 10px 12px !important;
            background: #ffffff !important;
          }

          .print-header-badge {
            background-color: #0f172a !important;
            color: #ffffff !important;
            padding: 3px 8px !important;
            border-radius: 4px !important;
            font-size: 8pt !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
        `}
      </style>

      <div
        id="assistente-comercial-print"
        className="hidden print:block print:bg-white text-slate-900 bg-white"
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <div className="max-w-[210mm] mx-auto p-4 text-slate-900 bg-white space-y-4">
          {/* Header Institucional com Identidade Visual */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="print-header-badge">SGFM • Grupo Flávio Moura</span>
                <span className="text-xs font-semibold text-slate-600">Trend Consultoria</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Resumo Executivo da Reunião Comercial
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Assistente Comercial — Neomaster e Neoprime
              </p>
            </div>
            <div className="text-right space-y-1 shrink-0">
              <img
                src={TREND_LOGO_URL}
                alt="Trend Consultoria"
                className="h-9 w-auto max-w-[36mm] object-contain ml-auto"
              />
              <p className="text-[10px] text-slate-500 font-medium pt-1">Emissão: {currentDate}</p>
            </div>
          </div>

          {/* Destaque do Lead & Resultado */}
          <div className="print-section print-card bg-slate-50 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Lead / Empresa
              </p>
              <h2 className="text-base font-bold text-slate-900">
                {formData.leadName || 'Lead não informado'}
                {formData.company ? ` • ${formData.company}` : ''}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Resultado Registrado
              </p>
              <span className="inline-block font-bold text-sm text-slate-900 border border-slate-400 rounded px-2.5 py-0.5 bg-white">
                {formData.resultado || 'Em andamento'}
              </span>
            </div>
          </div>

          {/* 1. Identificação do Lead */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              1. Identificação do Lead
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">Nome do Lead</span>
                <span className="font-medium text-slate-900">{formData.leadName || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">Empresa</span>
                <span className="font-medium text-slate-900">{formData.company || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">Segmento</span>
                <span className="font-medium text-slate-900">{formData.segment || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Colaboradores
                </span>
                <span className="font-medium text-slate-900">{formData.employees || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Tempo de Empresa
                </span>
                <span className="font-medium text-slate-900">{formData.tenure || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Canal de Origem
                </span>
                <span className="font-medium text-slate-900">{formData.channel || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Linha de Interesse
                </span>
                <span className="font-medium text-slate-900">
                  {formData.interest === 'neomaster'
                    ? 'Neomaster'
                    : formData.interest === 'neoprime'
                      ? 'Neoprime'
                      : formData.interest === 'indefinida'
                        ? 'Ainda não definido'
                        : '—'}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Participantes
                </span>
                <span className="font-medium text-slate-900">{formData.participants || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Decisor Presente
                </span>
                <span className="font-medium text-slate-900">
                  {formData.decisor === 'sim' ? 'Sim' : formData.decisor === 'nao' ? 'Não' : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Qualificação Comercial */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              2. Qualificação Comercial e Diagnóstico
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Faturamento Anual
                </span>
                <span className="font-medium text-slate-900">
                  {formatRevenueLabel(formData.revenue)}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">Urgência</span>
                <span className="font-medium text-slate-900">
                  {formatUrgencyLabel(formData.urgency)}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Consultoria Anterior
                </span>
                <span className="font-medium text-slate-900">
                  {formatHistoryLabel(formData.history)}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Capacidade Investimento
                </span>
                <span className="font-medium text-slate-900">
                  {formatLiquidityLabel(formData.liquidity)}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Prontidão Emocional
                </span>
                <span className="font-medium text-slate-900">
                  {formatReadinessLabel(formData.readiness)}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Horas em Operação
                </span>
                <span className="font-medium text-slate-900">{formData.horasOperacao || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Principal Dor Declarada
                </span>
                <p className="text-slate-900 mt-0.5">{formData.dorPrincipal || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Preocupação com Futuro (Tira o sono)
                </span>
                <p className="text-slate-900 mt-0.5">{formData.sonoFuturo || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Pode se afastar 15 dias sem parar a empresa?
                </span>
                <p className="text-slate-900 mt-0.5">{formData.sair15Dias || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Impacto da saída de um gestor-chave
                </span>
                <p className="text-slate-900 mt-0.5">{formData.saidaGestor || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Custo de rotatividade de equipe
                </span>
                <p className="text-slate-900 mt-0.5">{formData.custoRotatividade || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Cenário da empresa sem mudanças em 12 meses
                </span>
                <p className="text-slate-900 mt-0.5">{formData.cenario12Meses || '—'}</p>
              </div>
            </div>
          </div>

          {/* 3. Recomendação & Racional */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              3. Recomendação do Produto
            </h3>
            <div className="print-card mb-2 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Produto Indicado
                </span>
                <h4 className="text-sm font-bold text-slate-900">{productName}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{tier.reason}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Valor de Tabela
                </span>
                <p className="text-base font-bold text-slate-900">
                  {price === 0 ? 'Gratuito' : formatCurrency(price)}
                </p>
              </div>
            </div>

            {/* Dores & Objeções */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="print-card">
                <span className="font-bold text-slate-700 block text-[10px] uppercase mb-1">
                  Dores Tocadas ({pains.length})
                </span>
                {pains.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhuma dor identificada.</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                    {pains.map((p, i) => (
                      <li key={i}>{p.t}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="print-card">
                <span className="font-bold text-slate-700 block text-[10px] uppercase mb-1">
                  Objeções e Tratativas ({objections.length})
                </span>
                {objections.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhuma objeção mapeada.</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                    {objections.slice(0, 4).map((obj, i) => (
                      <li key={i}>
                        <span className="font-semibold">{obj.t}:</span> {obj.tr}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* 4. Tabela Comercial do Produto */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              4. Tabela Comercial — Condições de Pagamento ({productName})
            </h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '28%' }}>Condição</th>
                  <th style={{ textAlign: 'left' }}>Estrutura de Pagamento</th>
                  <th style={{ textAlign: 'right', width: '22%' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ fontWeight: 600 }}>
                      {row.c}
                      {row.carta && (
                        <span style={{ fontSize: '8pt', color: '#b45309', marginLeft: '4px' }}>
                          (uso sob autorização)
                        </span>
                      )}
                      {row.bonus && (
                        <div
                          style={{
                            fontSize: '8pt',
                            color: '#64748b',
                            fontWeight: 400,
                            marginTop: '2px',
                          }}
                        >
                          {row.bonus}
                        </div>
                      )}
                    </td>
                    <td>
                      {row.e}
                      {row.total && (
                        <div style={{ fontSize: '8pt', color: '#64748b' }}>Total: {row.total}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {row.carta
                        ? 'Sob Autorização'
                        : row.v === 0
                          ? 'Gratuito'
                          : formatCurrency(row.v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Fechamento e Próximos Passos */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              5. Fechamento e Próximos Passos
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">Resultado</span>
                <span className="font-bold text-slate-900">{formData.resultado || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Condição Escolhida
                </span>
                <span className="font-medium text-slate-900">
                  {formData.condicaoEscolhida || '—'}
                </span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Forma de Pagamento
                </span>
                <span className="font-medium text-slate-900">{formData.formaPagamento || '—'}</span>
              </div>
              <div className="print-card col-span-2">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Próximo Passo
                </span>
                <span className="font-medium text-slate-900">{formData.proximoPasso || '—'}</span>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Data Próximo Contato
                </span>
                <span className="font-medium text-slate-900">
                  {formData.dataProximoContato || '—'}
                </span>
              </div>
            </div>

            {/* Anotações Gerais */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Compromissos Fixados
                </span>
                <p className="text-slate-900 mt-0.5">{formData.compromissos || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Números Citados pelo Cliente
                </span>
                <p className="text-slate-900 mt-0.5">{formData.numerosCitados || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Termos e Frases do Cliente
                </span>
                <p className="text-slate-900 mt-0.5">{formData.termosCliente || '—'}</p>
              </div>
              <div className="print-card">
                <span className="font-semibold text-slate-500 block text-[10px]">
                  Indicações Citadas
                </span>
                <p className="text-slate-900 mt-0.5">{formData.indicacoes || '—'}</p>
              </div>
            </div>
          </div>

          {/* 6. Resumo Textual Estruturado */}
          <div className="print-section">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 mb-2 border-b border-slate-300">
              6. Resumo Estruturado da Reunião
            </h3>
            <div className="print-card bg-slate-50 font-mono text-[9pt] leading-relaxed whitespace-pre-wrap text-slate-800 border border-slate-300">
              {fullSummary}
            </div>
          </div>

          {/* Rodapé do documento impresso */}
          <div className="print-section pt-3 border-t border-slate-300 text-center text-[9pt] text-slate-500">
            <p className="font-semibold text-slate-700">
              Grupo Flávio Moura • SGFM — Sistema de Gestão Comercial e Mentoria
            </p>
            <p>Documento confidencial gerado pelo Assistente Comercial. Trend Consultoria LTDA.</p>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
