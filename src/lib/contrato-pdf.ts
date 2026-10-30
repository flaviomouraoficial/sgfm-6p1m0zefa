import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DadosContratoGeracao, construirClausulasContrato } from './contrato-builder'
import {
  DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA,
  NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA,
} from './contrato-verbatim-text'

/**
 * PARTE 11 — GERAÇÃO DO PDF
 * - Formato A4
 * - Prosa jurídica contínua, justificada, sem marcadores visuais, sem ícones e sem cores no corpo do contrato
 * - Cláusulas Primeira a Vigésima Segunda com numeração e títulos em negrito
 * - Parágrafos identificados por extenso
 * - Tabela da Cláusula Segunda renderizada como TABELA REAL
 * - Local e data por extenso
 * - Blocos de assinatura (contratante, contratada, testemunhas quando houver)
 * - Anexo Único em página nova
 * - Cabeçalho discreto com nome da entidade contratada e número do contrato
 * - Rodapé "Página X de Y"
 * - Página de registro de aceite com data, hora, endereço IP e identificação do usuário (trilha de auditoria)
 */

export async function gerarContratoPDF(dados: DadosContratoGeracao): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight
  const topMargin = 22
  const bottomMargin = 22

  let cursorY = topMargin

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage()
      cursorY = topMargin
    }
  }

  // Título Centralizado
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  const titulo = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TREINAMENTO EMPRESARIAL'
  doc.text(titulo, pageWidth / 2, cursorY, { align: 'center', maxWidth: contentWidth })
  cursorY += 12

  // Preâmbulo
  doc.setFont('times', 'normal')
  doc.setFontSize(10.5)

  const preambuloIntro =
    'Pelo presente instrumento particular de prestação de serviços, de um lado, doravante denominada:'
  doc.text(preambuloIntro, marginLeft, cursorY, { maxWidth: contentWidth })
  cursorY += 6

  // CONTRATANTE
  doc.setFont('times', 'bold')
  doc.text('CONTRATANTE: ', marginLeft, cursorY)
  const wContratanteLabel = doc.getTextWidth('CONTRATANTE: ')
  doc.setFont('times', 'normal')

  const contratanteQualificacao = `${dados.contratanteRazaoSocial || dados.contratanteNome}, inscrita no CNPJ sob nº ${dados.contratanteCnpj}, estabelecida à ${dados.contratanteEnderecoCompleto}, em ${dados.contratanteCidadeUf}, e representada legalmente por ${dados.repContratanteNome}, ${dados.repContratanteNacionalidade}, ${dados.repContratanteEstadoCivil}, ${dados.repContratanteProfissao}, portador(a) do RG nº ${dados.repContratanteRg} e CPF nº ${dados.repContratanteCpf}, com e-mail para notificações: ${dados.contratanteEmailNotificacoes}, e de outro lado, como:`

  const linesContratante = doc.splitTextToSize(
    contratanteQualificacao,
    contentWidth - wContratanteLabel,
  )
  doc.text(linesContratante[0] || '', marginLeft + wContratanteLabel, cursorY)
  cursorY += 4.5
  if (linesContratante.length > 1) {
    const restLines = linesContratante.slice(1)
    doc.text(restLines, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
    cursorY += restLines.length * 4.5 + 2
  } else {
    cursorY += 2
  }

  // CONTRATADA
  checkPageBreak(15)
  doc.setFont('times', 'bold')
  doc.text('CONTRATADA: ', marginLeft, cursorY)
  const wContratadaLabel = doc.getTextWidth('CONTRATADA: ')
  doc.setFont('times', 'normal')

  const contratadaQualificacao = `${dados.contratadaRazaoSocial || dados.contratadaNome}, inscrita no CNPJ sob nº ${dados.contratadaCnpj}, estabelecida à ${dados.contratadaEnderecoCompleto}, em ${dados.contratadaCidadeUf}, e representada legalmente por ${dados.repContratadaNome}, ${dados.repContratadaNacionalidade}, ${dados.repContratadaEstadoCivil}, ${dados.repContratadaProfissao}, portador(a) do RG nº ${dados.repContratadaRg} e CPF nº ${dados.repContratadaCpf}, com e-mail para notificações: ${dados.contratadaEmailNotificacoes}, têm, entre si, justos e acordados, quanto ao que se segue:`

  const linesContratada = doc.splitTextToSize(
    contratadaQualificacao,
    contentWidth - wContratadaLabel,
  )
  doc.text(linesContratada[0] || '', marginLeft + wContratadaLabel, cursorY)
  cursorY += 4.5
  if (linesContratada.length > 1) {
    const restLines = linesContratada.slice(1)
    doc.text(restLines, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
    cursorY += restLines.length * 4.5 + 3
  } else {
    cursorY += 3
  }

  // Declaração de destinação empresarial (Preâmbulo)
  checkPageBreak(15)
  doc.setFont('times', 'italic')
  const linesDeclaracao = doc.splitTextToSize(DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA, contentWidth)
  doc.text(linesDeclaracao, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
  cursorY += linesDeclaracao.length * 4.5 + 4
  doc.setFont('times', 'normal')

  // Cláusulas estruturadas
  const clausulas = construirClausulasContrato(dados)

  for (const c of clausulas) {
    checkPageBreak(18)

    // Título da cláusula em negrito
    doc.setFont('times', 'bold')
    const tituloClausula = `Cláusula ${c.numeroOrdinal} – ${c.titulo}`
    const linesTitulo = doc.splitTextToSize(tituloClausula, contentWidth)
    doc.text(linesTitulo, marginLeft, cursorY)
    cursorY += linesTitulo.length * 4.8 + 2
    doc.setFont('times', 'normal')

    // Corpo da cláusula
    for (const corpoP of c.corpo) {
      checkPageBreak(12)
      const linesCorpo = doc.splitTextToSize(corpoP, contentWidth)
      doc.text(linesCorpo, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
      cursorY += linesCorpo.length * 4.5 + 2
    }

    // Se for Cláusula 2: renderizar TABELA REAL
    if (c.isTabela) {
      checkPageBreak(25)

      const tableRows = (dados.modulos || []).map((m) => [
        String(m?.servico ?? ''),
        String(m?.data_ou_periodo ?? ''),
        `${Number(m?.carga_horaria_horas ?? 0)}h`,
        String(m?.formato ?? 'Presencial'),
        String(m?.participantes_max ?? 0),
        `R$ ${Number(m?.valor_parcela ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        String(m?.vencimento ?? ''),
      ])

      // Linha fixa VALOR TOTAL
      tableRows.push([
        'VALOR TOTAL',
        '—',
        `${Number(dados.cargaHorariaTotal ?? 0)}h`,
        '—',
        '—',
        `R$ ${Number(dados.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        '—',
      ])

      autoTable(doc, {
        startY: cursorY,
        head: [
          [
            'Serviço/Módulo/Evento',
            'Data ou período',
            'Carga horária',
            'Formato',
            'Participantes (máx.)',
            'Valor da parcela',
            'Vencimento',
          ],
        ],
        body: tableRows,
        margin: { left: marginLeft, right: marginRight },
        theme: 'plain',
        styles: {
          font: 'times',
          fontSize: 8.5,
          cellPadding: 1.8,
          textColor: [0, 0, 0],
          lineColor: [100, 100, 100],
          lineWidth: 0.2,
        },
        headStyles: {
          fontStyle: 'bold',
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 32 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 18, halign: 'center' },
        },
        didParseCell: (data: any) => {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })

      const finalY = (doc as any).lastAutoTable?.finalY ?? cursorY + 30
      cursorY = finalY + 4
    }

    // Itens com letras (Ex: Cláusula de Rescisão: a), b))
    if (c.itensLetras && c.itensLetras.length > 0) {
      for (const item of c.itensLetras) {
        checkPageBreak(12)
        const itemCompleto = `${item.letra} ${item.texto}`
        const linesItem = doc.splitTextToSize(itemCompleto, contentWidth - 5)
        doc.text(linesItem, marginLeft + 5, cursorY, {
          maxWidth: contentWidth - 5,
          align: 'justify',
        })
        cursorY += linesItem.length * 4.5 + 2
      }
    }

    // Parágrafos
    for (const p of c.paragrafos) {
      checkPageBreak(12)
      const label = p.titulo ? `${p.titulo} ` : ''
      const textoCompleto = `${label}${p.texto}`

      doc.setFont('times', 'bold')
      const wLabel = doc.getTextWidth(label)
      doc.setFont('times', 'normal')

      const lines = doc.splitTextToSize(textoCompleto, contentWidth)
      doc.setFont('times', 'bold')
      doc.text(label, marginLeft, cursorY)
      doc.setFont('times', 'normal')

      // restante do texto após o label na primeira linha
      const firstLineWithoutLabel = lines[0].substring(label.length)
      doc.text(firstLineWithoutLabel, marginLeft + wLabel, cursorY)
      cursorY += 4.5

      if (lines.length > 1) {
        const restLines = lines.slice(1)
        doc.text(restLines, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
        cursorY += restLines.length * 4.5 + 2
      } else {
        cursorY += 2
      }
    }

    cursorY += 2
  }

  // Local e data por extenso
  checkPageBreak(30)
  cursorY += 4
  doc.setFont('times', 'normal')
  doc.text(dados.cidadeDataAssinatura, marginLeft, cursorY)
  cursorY += 16

  // Bloco de Assinaturas Principais
  checkPageBreak(35)
  const colWidth = (contentWidth - 10) / 2
  const lineY = cursorY

  // Assinatura CONTRATANTE
  doc.line(marginLeft, lineY, marginLeft + colWidth, lineY)
  doc.setFont('times', 'bold')
  doc.text('CONTRATANTE', marginLeft + colWidth / 2, lineY + 4, { align: 'center' })
  doc.setFont('times', 'normal')
  doc.text(
    dados.contratanteRazaoSocial || dados.contratanteNome,
    marginLeft + colWidth / 2,
    lineY + 8,
    {
      align: 'center',
      maxWidth: colWidth,
    },
  )
  doc.text(`Rep. Legal: ${dados.repContratanteNome}`, marginLeft + colWidth / 2, lineY + 12, {
    align: 'center',
    maxWidth: colWidth,
  })

  // Assinatura CONTRATADA
  const col2X = marginLeft + colWidth + 10
  doc.line(col2X, lineY, col2X + colWidth, lineY)
  doc.setFont('times', 'bold')
  doc.text('CONTRATADA', col2X + colWidth / 2, lineY + 4, { align: 'center' })
  doc.setFont('times', 'normal')
  doc.text(dados.contratadaRazaoSocial || dados.contratadaNome, col2X + colWidth / 2, lineY + 8, {
    align: 'center',
    maxWidth: colWidth,
  })
  doc.text(`Rep. Legal: ${dados.repContratadaNome}`, col2X + colWidth / 2, lineY + 12, {
    align: 'center',
    maxWidth: colWidth,
  })

  cursorY = lineY + 22

  // Testemunhas (quando houver)
  if (dados.haveraTestemunhas && dados.testemunhas && dados.testemunhas.length > 0) {
    checkPageBreak(40)
    doc.setFont('times', 'bold')
    doc.text('Testemunhas:', marginLeft, cursorY)
    cursorY += 12

    for (let i = 0; i < dados.testemunhas.length; i += 2) {
      const t1 = dados.testemunhas[i]
      const t2 = dados.testemunhas[i + 1]

      const tLineY = cursorY
      doc.line(marginLeft, tLineY, marginLeft + colWidth, tLineY)
      doc.setFont('times', 'normal')
      doc.text(`Nome: ${t1.nome || '_______________________'}`, marginLeft, tLineY + 4)
      doc.text(`RG: ${t1.rg || '___________________________'}`, marginLeft, tLineY + 8)

      if (t2) {
        doc.line(col2X, tLineY, col2X + colWidth, tLineY)
        doc.text(`Nome: ${t2.nome || '_______________________'}`, col2X, tLineY + 4)
        doc.text(`RG: ${t2.rg || '___________________________'}`, col2X, tLineY + 8)
      }

      cursorY = tLineY + 16
    }
  }

  // =========================================================================
  // ANEXO ÚNICO – PROPOSTA COMERCIAL (PÁGINA NOVA)
  // =========================================================================
  doc.addPage()
  cursorY = topMargin

  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.text('ANEXO ÚNICO – PROPOSTA COMERCIAL', pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 8

  doc.setFont('times', 'normal')
  doc.setFontSize(9.5)
  const introAnexo =
    'A proposta comercial a seguir integra o presente contrato na forma da Cláusula Terceira. Nos termos do Parágrafo segundo da Cláusula Terceira, somente a versão final da proposta comercial, com todas as opções resolvidas e sem pendências, integra este instrumento.'
  const linesIntroAnexo = doc.splitTextToSize(introAnexo, contentWidth)
  doc.text(linesIntroAnexo, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
  cursorY += linesIntroAnexo.length * 4.2 + 4

  // Dados da Proposta
  doc.setFont('times', 'bold')
  doc.text('Dados da Proposta Comercial:', marginLeft, cursorY)
  cursorY += 5
  doc.setFont('times', 'normal')

  const infoProposta = [
    `Proposta nº: ${dados.anexoPropostaNumero || dados.numeroContrato} | Data: ${dados.anexoPropostaData || dados.dataAssinaturaExtenso} | Validade: ${dados.anexoPropostaValidade || '30 dias'}`,
    `Contratada (consultoria): ${dados.contratadaRazaoSocial || dados.contratadaNome} | Consultor responsável: ${dados.consultorResponsavel || dados.repContratadaNome}`,
    `Contratante (cliente): ${dados.contratanteRazaoSocial || dados.contratanteNome}`,
    `Local/Formato de execução: ${dados.formatoGeral}${dados.localInfraestrutura ? ` - ${dados.localInfraestrutura}` : ''}`,
    `Número máximo de participantes: ${Math.max(...dados.modulos.map((m) => m.participantes_max), 1)} profissionais`,
  ]

  for (const info of infoProposta) {
    doc.text(info, marginLeft, cursorY, { maxWidth: contentWidth })
    cursorY += 4.5
  }
  cursorY += 3

  // 1. Programa Contratado
  doc.setFont('times', 'bold')
  doc.text(
    `1. Programa contratado: ${dados.anexoProgramaNome || 'PROGRAMA DE DESENVOLVIMENTO EMPRESARIAL IN COMPANY'}`,
    marginLeft,
    cursorY,
  )
  cursorY += 6
  doc.setFont('times', 'normal')

  if (dados.anexoModulos && dados.anexoModulos.length > 0) {
    for (const mod of dados.anexoModulos) {
      if (!mod.titulo && (!mod.topicos || mod.topicos.filter(Boolean).length === 0)) {
        continue
      }
      checkPageBreak(20)
      doc.setFont('times', 'bold')
      const tituloMod = mod.carga_horaria
        ? `${mod.titulo || 'Módulo'} (${mod.carga_horaria})`
        : mod.titulo || 'Módulo'
      doc.text(tituloMod, marginLeft, cursorY)
      cursorY += 4.5
      doc.setFont('times', 'normal')
      const topicosValidos = (mod.topicos || []).filter(Boolean)
      if (topicosValidos.length > 0) {
        const topicosStr = topicosValidos.join('; ') + '.'
        const linesTopicos = doc.splitTextToSize(topicosStr, contentWidth - 4)
        doc.text(linesTopicos, marginLeft + 4, cursorY, {
          maxWidth: contentWidth - 4,
          align: 'justify',
        })
        cursorY += linesTopicos.length * 4.2 + 3
      } else {
        cursorY += 2
      }
    }
  }

  // 2. Cronograma Previsto
  checkPageBreak(15)
  doc.setFont('times', 'bold')
  doc.text('2. Cronograma previsto:', marginLeft, cursorY)
  cursorY += 4.5
  doc.setFont('times', 'normal')

  const cronoStr = dados.modulos.map((m) => `${m.servico}: ${m.data_ou_periodo}`).join(' | ')
  const linesCrono = doc.splitTextToSize(cronoStr, contentWidth)
  doc.text(linesCrono, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
  cursorY += linesCrono.length * 4.2 + 4

  // 3. Investimento e Parcelamento
  checkPageBreak(20)
  doc.setFont('times', 'bold')
  doc.text('3. Investimento e parcelamento:', marginLeft, cursorY)
  cursorY += 4.5
  doc.setFont('times', 'normal')

  const parcelasStr = dados.modulos
    .map(
      (m, idx) =>
        `${idx + 1}ª parcela R$ ${m.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${m.servico}) vencimento ${m.vencimento}`,
    )
    .join('; ')

  const investStr = `Valor total: R$ ${dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, dividido em ${dados.modulos.length} parcelas conforme cronograma: ${parcelasStr}. Impostos incidentes sobre a prestação de serviços: sob responsabilidade da CONTRATADA.`
  const linesInvest = doc.splitTextToSize(investStr, contentWidth)
  doc.text(linesInvest, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
  cursorY += linesInvest.length * 4.2 + 4

  // 4. Despesas de Viagem
  if (dados.despesasViagemAtivas) {
    checkPageBreak(25)
    doc.setFont('times', 'bold')
    doc.text('4. Despesas de viagem:', marginLeft, cursorY)
    cursorY += 4.5
    doc.setFont('times', 'normal')

    const despLines = [
      `4.1. Transporte: ${dados.despesasTransporte || 'passagem aérea ou terrestre ida e volta, custeada pela CONTRATADA e reembolsada pela CONTRATANTE mediante comprovação.'}`,
      `4.2. Hospedagem: ${dados.despesasHospedagem || 'diária em hotel categoria executiva ou equivalente custeada pela CONTRATANTE.'}`,
      `4.3. Alimentação: ${dados.despesasAlimentacao || 'ajuda de custo fixa por dia de treinamento, paga pela CONTRATANTE.'}`,
      `4.4. Deslocamento local: ${dados.despesasDeslocamentoLocal || 'traslado aeroporto-hotel-local de treinamento sob responsabilidade da CONTRATANTE.'}`,
      '4.5. Qualquer despesa extraordinária observará as condições descritas no contrato.',
    ]

    for (const dl of despLines) {
      const linesD = doc.splitTextToSize(dl, contentWidth)
      doc.text(linesD, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
      cursorY += linesD.length * 4.2 + 2
    }
  }

  // 5. Lista Nominal de Participantes (quando ≤ 5)
  const modulosComNominais = dados.modulos.filter(
    (m) =>
      m.participantes_max <= 5 && m.participantes_nominais && m.participantes_nominais.length > 0,
  )

  if (modulosComNominais.length > 0) {
    checkPageBreak(30)
    doc.setFont('times', 'bold')
    doc.text('5. Relação Nominal de Participantes (Destinação Empresarial):', marginLeft, cursorY)
    cursorY += 5
    doc.setFont('times', 'normal')

    for (const m of modulosComNominais) {
      checkPageBreak(15)
      doc.setFont('times', 'bold')
      doc.text(`${m.servico}:`, marginLeft + 2, cursorY)
      cursorY += 4
      doc.setFont('times', 'normal')

      m.participantes_nominais?.forEach((p, idx) => {
        doc.text(`${idx + 1}. ${p.nome_completo} — CPF: ${p.cpf}`, marginLeft + 6, cursorY)
        cursorY += 4
      })
      cursorY += 2
    }

    // NOTA DE RODAPÉ EXATA
    doc.setFont('times', 'italic')
    doc.setFontSize(8.5)
    const linesNota = doc.splitTextToSize(
      `Nota: ${NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA}`,
      contentWidth,
    )
    doc.text(linesNota, marginLeft, cursorY, { maxWidth: contentWidth })
    cursorY += linesNota.length * 3.8 + 4
    doc.setFontSize(9.5)
    doc.setFont('times', 'normal')
  }

  // =========================================================================
  // PÁGINA FINAL: REGISTRO DE ACEITE E AUDITORIA
  // =========================================================================
  doc.addPage()
  cursorY = topMargin

  doc.setFont('times', 'bold')
  doc.setFontSize(13)
  doc.text('REGISTRO DE ACEITE E TRILHA DE AUDITORIA', pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 10

  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  const auditIntro =
    'O presente instrumento foi emitido eletronicamente pela plataforma administrativa SGFM. Abaixo constam os registros probatórios de destinação empresarial, aceite dos termos e verificação de integridade formal.'
  const linesAudit = doc.splitTextToSize(auditIntro, contentWidth)
  doc.text(linesAudit, marginLeft, cursorY, { maxWidth: contentWidth, align: 'justify' })
  cursorY += linesAudit.length * 4.5 + 8

  // Box de auditoria
  doc.setDrawColor(180, 180, 180)
  doc.rect(marginLeft, cursorY, contentWidth, 75)

  let bY = cursorY + 7
  doc.setFont('times', 'bold')
  doc.text('DECLARAÇÃO DE DESTINAÇÃO EMPRESARIAL DO PREÂMBULO:', marginLeft + 5, bY)
  bY += 5
  doc.setFont('times', 'italic')
  doc.setFontSize(9)
  const boxDecl = doc.splitTextToSize(
    `"${DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA}"`,
    contentWidth - 10,
  )
  doc.text(boxDecl, marginLeft + 5, bY, { maxWidth: contentWidth - 10, align: 'justify' })
  bY += boxDecl.length * 4 + 4

  doc.setFont('times', 'bold')
  doc.setFontSize(9.5)
  doc.text('DADOS DO ACEITE ELETRÔNICO:', marginLeft + 5, bY)
  bY += 5
  doc.setFont('times', 'normal')
  doc.text(`• Status de Aceite: ACEITO E VINCULADO PELAS PARTES`, marginLeft + 8, bY)
  bY += 4.5
  doc.text(`• Data e Hora da Emissão/Aceite: ${dados.aceiteDataHora}`, marginLeft + 8, bY)
  bY += 4.5
  doc.text(`• Usuário Responsável no Sistema: ${dados.aceiteUsuarioNome}`, marginLeft + 8, bY)
  bY += 4.5
  doc.text(
    `• Endereço IP do Emissor: ${dados.aceiteIp || '127.0.0.1 (Conexão Segura)'}`,
    marginLeft + 8,
    bY,
  )
  bY += 4.5
  doc.text(`• Número de Controle do Contrato: ${dados.numeroContrato}`, marginLeft + 8, bY)

  cursorY += 85

  doc.setFont('times', 'italic')
  doc.setFontSize(8.5)
  doc.text(
    'Este documento possui validade jurídica como instrumento particular de prestação de serviços empresariais nos termos da legislação civil vigente.',
    marginLeft,
    cursorY,
    { maxWidth: contentWidth, align: 'center' },
  )

  // =========================================================================
  // CABEÇALHO E RODAPÉ (Página X de Y) EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = doc.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Cabeçalho discreto
    doc.setFont('times', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`${dados.contratadaNome.toUpperCase()} — ${dados.numeroContrato}`, marginLeft, 12)
    doc.line(marginLeft, 14, pageWidth - marginRight, 14)

    // Rodapé "Página X de Y"
    doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
    const rodapeText = `Página ${i} de ${totalPages}`
    doc.text(rodapeText, pageWidth - marginRight, pageHeight - 8, { align: 'right' })
    doc.text(
      'Contrato de Prestação de Serviços de Treinamento Empresarial In Company',
      marginLeft,
      pageHeight - 8,
    )
    doc.setTextColor(0, 0, 0)
  }

  return doc.output('blob')
}
