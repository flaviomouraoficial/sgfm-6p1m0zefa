import type { ProposalFormData } from '@/lib/proposal-defaults'
import { proposalToFormData } from '@/lib/proposal-defaults'

export interface CondicaoComercialPDFItem {
  valor_modulo: number
  valor_global: number
  valor_creditado: number
  valor_liquido: number
  prazo_pagamento: string
}

export interface ProposalPDFData {
  cliente_nome: string
  nome_contato: string
  nome_evento: string
  objetivo: string
  publico_alvo: string
  cronograma: string
  local: string
  formato: string
  estrutura_programa: string
  valor_modulo_4h: number
  valor_modulo_8h: number
  valor_global: number
  condicoes_pagamento: string
  validade_proposta: string
  data_geracao: string
  texto_institucional: string
  condicoes_gerais: string
  perfil_instrutor: string
  description: string
  logoUrl?: string
  condicoes_comerciais?: CondicaoComercialPDFItem[]
}

function fmtCurrency(v: number): string {
  if (!v || isNaN(v)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtDate(s: string): string {
  if (!s) return ''
  try {
    return new Date(s).toLocaleDateString('pt-BR')
  } catch {
    return s
  }
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildProposalPDFData(
  data: ProposalFormData | Record<string, any>,
  clientName: string,
  logoUrl?: string,
): ProposalPDFData {
  const fd =
    data instanceof Object && 'cliente_id' in data
      ? (data as ProposalFormData)
      : proposalToFormData(data)

  const parsedCondicoes: CondicaoComercialPDFItem[] = (fd.condicoes_comerciais || []).map((c) => ({
    valor_modulo: parseFloat(c.valor_modulo) || 0,
    valor_global: parseFloat(c.valor_global) || 0,
    valor_creditado: parseFloat(c.valor_creditado) || 0,
    valor_liquido: parseFloat(c.valor_liquido) || 0,
    prazo_pagamento: c.prazo_pagamento || '',
  }))

  return {
    cliente_nome: clientName,
    nome_contato: fd.nome_contato || '',
    nome_evento: fd.nome_evento || '',
    objetivo: fd.objetivo || '',
    publico_alvo: fd.publico_alvo || '',
    cronograma: fd.cronograma || '',
    local: fd.local || '',
    formato: fd.formato || '',
    estrutura_programa: fd.estrutura_programa || '',
    valor_modulo_4h: parseFloat(fd.valor_modulo_4h) || 0,
    valor_modulo_8h: parseFloat(fd.valor_modulo_8h) || 0,
    valor_global: parseFloat(fd.valor_global) || parsedCondicoes[0]?.valor_global || 0,
    condicoes_pagamento: fd.condicoes_pagamento || '',
    validade_proposta: fd.validade_proposta || '',
    data_geracao: fd.data_geracao || '',
    texto_institucional: fd.texto_institucional || '',
    condicoes_gerais: fd.condicoes_gerais || '',
    perfil_instrutor: fd.perfil_instrutor || '',
    description: fd.description || '',
    condicoes_comerciais: parsedCondicoes,
    logoUrl,
  }
}

export function generateProposalPDF(data: ProposalPDFData): void {
  const logo = data.logoUrl || 'https://img.usecurling.com/i?q=company&shape=fill&color=green'
  const coverImage =
    'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/758c1f96-51d3-4a11-a8e0-ca9c403166d0/proposta-trend-c8849.jpg'

  // Build rows for dynamic Investment table
  let investimentoRowsHtml = ''
  if (data.condicoes_comerciais && data.condicoes_comerciais.length > 0) {
    investimentoRowsHtml = data.condicoes_comerciais
      .map(
        (c, idx) => `<tr>
          <td>Opção ${idx + 1}</td>
          <td>${fmtCurrency(c.valor_modulo)}</td>
          <td style="font-weight:bold;">${fmtCurrency(c.valor_global)}</td>
          <td>${fmtCurrency(c.valor_creditado)}</td>
          <td style="color:#288f87;font-weight:bold;">${fmtCurrency(c.valor_liquido)}</td>
          <td>${esc(c.prazo_pagamento || '-')}</td>
        </tr>`,
      )
      .join('')
  } else {
    investimentoRowsHtml = `
      <tr><td>Módulo 4 horas</td><td colspan="5">${fmtCurrency(data.valor_modulo_4h)}</td></tr>
      <tr><td>Módulo 8 horas</td><td colspan="5">${fmtCurrency(data.valor_modulo_8h)}</td></tr>
      <tr><td>Valor Global</td><td colspan="5" style="font-weight:bold;">${fmtCurrency(data.valor_global)}</td></tr>
    `
  }

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Proposta - ${esc(data.nome_evento)}</title>
<style>
@page {
  size: A4;
  margin: 0;
}
* {
  box-sizing: border-box;
}
body {
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
  line-height: 1.6;
  font-size: 13px;
  margin: 0;
  padding: 0;
  background-color: #fff;
}

/* Cover page container */
.cover-page {
  position: relative;
  width: 210mm;
  height: 297mm;
  page-break-after: always;
  background-image: url('${coverImage}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

/* Position text directly below the PROPOSTA text in the template image */
.cover-content {
  position: absolute;
  top: 44.5%;
  left: 72.5%;
  width: 25%;
  text-align: left;
  color: #ffffff;
}

.cover-client {
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.6);
  word-wrap: break-word;
}

.cover-event {
  font-size: 15px;
  font-weight: 400;
  color: #e0f2f1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  word-wrap: break-word;
}

/* Content pages container */
.content-wrapper {
  padding: 18mm 18mm 18mm 18mm;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #288f87;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.header img {
  height: 60px;
  object-fit: contain;
}
.header h1 {
  color: #288f87;
  font-size: 20px;
  margin: 0;
  text-align: right;
}
.section {
  margin-bottom: 18px;
  page-break-inside: avoid;
}
.section h2 {
  color: #288f87;
  font-size: 15px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 4px;
  margin: 0 0 6px;
}
.section p {
  margin: 0;
  white-space: pre-wrap;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 13px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.info-grid div strong {
  color: #288f87;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}
th {
  background: #288f87;
  color: #fff;
  padding: 8px;
  text-align: left;
  font-size: 12px;
}
td {
  padding: 8px;
  border: 1px solid #ddd;
  font-size: 12px;
}
.signature {
  margin-top: 40px;
  text-align: center;
  page-break-inside: avoid;
}
.signature-line {
  border-top: 1px solid #333;
  width: 280px;
  margin: 40px auto 5px;
}
.footer {
  margin-top: 40px;
  padding-top: 12px;
  border-top: 2px solid #288f87;
  text-align: center;
  font-size: 11px;
  color: #777;
  page-break-inside: avoid;
}
@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style></head><body>

<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-content">
    <div class="cover-client">${esc(data.cliente_nome)}</div>
    <div class="cover-event">${esc(data.nome_evento)}</div>
  </div>
</div>

<!-- BODY PAGES -->
<div class="content-wrapper">
  <div class="header">
    <img src="${esc(logo)}" alt="Logo">
    <h1>PROPOSTA COMERCIAL</h1>
  </div>

  <div class="info-grid">
    <div><strong>Cliente:</strong> ${esc(data.cliente_nome)}</div>
    <div><strong>Contato:</strong> ${esc(data.nome_contato)}</div>
    <div><strong>Evento:</strong> ${esc(data.nome_evento)}</div>
    <div><strong>Local:</strong> ${esc(data.local)}</div>
    <div><strong>Data de Geração:</strong> ${fmtDate(data.data_geracao)}</div>
    <div><strong>Validade:</strong> ${esc(data.validade_proposta)}</div>
  </div>

  <div class="section"><h2>1. Quem Somos</h2><p>${esc(data.texto_institucional)}</p></div>
  <div class="section"><h2>2. Serviços Oferecidos</h2><p>${esc(data.description)}</p></div>
  <div class="section"><h2>3. Objetivo</h2><p>${esc(data.objetivo)}</p></div>
  <div class="section"><h2>4. Público-alvo</h2><p>${esc(data.publico_alvo)}</p></div>
  <div class="section"><h2>5. Cronograma</h2><p>${esc(data.cronograma)}</p></div>
  <div class="section"><h2>6. Formato</h2><p>${esc(data.formato)}</p></div>
  <div class="section"><h2>7. Estrutura do Programa</h2><p>${esc(data.estrutura_programa)}</p></div>

  <div class="section">
    <h2>8. Investimento</h2>
    <table>
      <thead>
        <tr>
          <th>Opção / Item</th>
          <th>Valor Módulo</th>
          <th>Valor Global</th>
          <th>Valor Creditado</th>
          <th>Valor Líquido</th>
          <th>Prazo de Pagamento</th>
        </tr>
      </thead>
      <tbody>
        ${investimentoRowsHtml}
      </tbody>
    </table>
    ${data.condicoes_pagamento ? `<p style="margin-top:8px;"><strong>Observações de Pagamento:</strong> ${esc(data.condicoes_pagamento)}</p>` : ''}
  </div>

  <div class="section"><h2>9. Condições Gerais</h2><p>${esc(data.condicoes_gerais)}</p></div>
  
  <div class="signature">
    <p>${fmtDate(data.data_geracao)}</p>
    <div class="signature-line"></div>
    <p><strong>${esc(data.cliente_nome)}</strong></p>
  </div>

  <div class="section" style="margin-top: 30px;"><h2>10. Perfil do Instrutor</h2><p>${esc(data.perfil_instrutor)}</p></div>

  <div class="footer">
    <p><strong>Trend Consultoria LTDA</strong> - CNPJ: 09.465.223/0001-07</p>
    <p>contato@trendconsultoria.com.br | (43) 99629-1060</p>
  </div>
</div>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    alert('Por favor, permita popups para gerar o PDF.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 500)
}
