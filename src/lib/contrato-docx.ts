import { DadosContratoGeracao, construirClausulasContrato } from './contrato-builder'
import {
  DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA,
  NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA,
} from './contrato-verbatim-text'

/**
 * Exporta o contrato em formato DOCX editável (Word)
 * Utiliza o formato padrão WordprocessingML / HTML-DOC compatível com Microsoft Word e LibreOffice
 */
export function exportarContratoDocx(dados: DadosContratoGeracao): Blob {
  const clausulas = construirClausulasContrato(dados)

  const modulosRows = dados.modulos
    .map(
      (m) => `
    <tr>
      <td style="border: 1px solid #000; padding: 4px;">${m.servico}</td>
      <td style="border: 1px solid #000; padding: 4px;">${m.data_ou_periodo}</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: center;">${m.carga_horaria_horas}h</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: center;">${m.formato}</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: center;">${m.participantes_max}</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: right;">R$ ${m.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border: 1px solid #000; padding: 4px; text-align: center;">${m.vencimento}</td>
    </tr>
  `,
    )
    .join('')

  const clausulasHtml = clausulas
    .map((c) => {
      let html = `<p style="margin-top: 14pt; margin-bottom: 4pt;"><strong>Cláusula ${c.numeroOrdinal} – ${c.titulo}</strong></p>`
      for (const p of c.corpo) {
        html += `<p style="text-align: justify; margin-bottom: 6pt;">${p}</p>`
      }

      if (c.isTabela) {
        html += `
        <table style="width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9pt;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 4px;">Serviço/Módulo/Evento</th>
              <th style="border: 1px solid #000; padding: 4px;">Data ou período</th>
              <th style="border: 1px solid #000; padding: 4px;">Carga horária</th>
              <th style="border: 1px solid #000; padding: 4px;">Formato</th>
              <th style="border: 1px solid #000; padding: 4px;">Participantes (máx.)</th>
              <th style="border: 1px solid #000; padding: 4px;">Valor da parcela</th>
              <th style="border: 1px solid #000; padding: 4px;">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${modulosRows}
            <tr style="font-weight: bold; background-color: #fafafa;">
              <td style="border: 1px solid #000; padding: 4px;">VALOR TOTAL</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">—</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">${dados.cargaHorariaTotal}h</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">—</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">—</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right;">R$ ${dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">—</td>
            </tr>
          </tbody>
        </table>
      `
      }

      if (c.itensLetras) {
        for (const item of c.itensLetras) {
          html += `<p style="margin-left: 20pt; text-align: justify; margin-bottom: 4pt;">${item.letra} ${item.texto}</p>`
        }
      }

      for (const p of c.paragrafos) {
        html += `<p style="text-align: justify; margin-bottom: 6pt;"><strong>${p.titulo ? p.titulo + ' ' : ''}</strong>${p.texto}</p>`
      }

      return html
    })
    .join('')

  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${dados.numeroContrato}</title>
      <style>
        @page {
          size: A4;
          margin: 2.5cm 2cm 2.5cm 2cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
        }
        p {
          margin: 0 0 6pt 0;
          text-align: justify;
        }
        h1 {
          font-size: 14pt;
          text-align: center;
          margin-bottom: 16pt;
          font-weight: bold;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TREINAMENTO EMPRESARIAL</h1>
      
      <p>Pelo presente instrumento particular de prestação de serviços, de um lado, doravante denominada:</p>
      
      <p><strong>CONTRATANTE:</strong> ${dados.contratanteRazaoSocial || dados.contratanteNome}, inscrita no CNPJ sob nº ${dados.contratanteCnpj}, estabelecida à ${dados.contratanteEnderecoCompleto}, em ${dados.contratanteCidadeUf}, e representada legalmente por ${dados.repContratanteNome}, ${dados.repContratanteNacionalidade}, ${dados.repContratanteEstadoCivil}, ${dados.repContratanteProfissao}, portador(a) do RG nº ${dados.repContratanteRg} e CPF nº ${dados.repContratanteCpf}, com e-mail para notificações: ${dados.contratanteEmailNotificacoes}, e de outro lado, como:</p>
      
      <p><strong>CONTRATADA:</strong> ${dados.contratadaRazaoSocial || dados.contratadaNome}, inscrita no CNPJ sob nº ${dados.contratadaCnpj}, estabelecida à ${dados.contratadaEnderecoCompleto}, em ${dados.contratadaCidadeUf}, e representada legalmente por ${dados.repContratadaNome}, ${dados.repContratadaNacionalidade}, ${dados.repContratadaEstadoCivil}, ${dados.repContratadaProfissao}, portador(a) do RG nº ${dados.repContratadaRg} e CPF nº ${dados.repContratadaCpf}, com e-mail para notificações: ${dados.contratadaEmailNotificacoes}, têm, entre si, justos e acordados, quanto ao que se segue:</p>
      
      <p><em>"${DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA}"</em></p>
      
      ${clausulasHtml}
      
      <p style="margin-top: 18pt;">${dados.cidadeDataAssinatura}.</p>
      
      <table style="width: 100%; margin-top: 35pt;">
        <tr>
          <td style="width: 48%; text-align: center; border-top: 1px solid #000; padding-top: 5pt;">
            <strong>CONTRATANTE</strong><br>
            ${dados.contratanteRazaoSocial || dados.contratanteNome}<br>
            Rep. Legal: ${dados.repContratanteNome}
          </td>
          <td style="width: 4%;"></td>
          <td style="width: 48%; text-align: center; border-top: 1px solid #000; padding-top: 5pt;">
            <strong>CONTRATADA</strong><br>
            ${dados.contratadaRazaoSocial || dados.contratadaNome}<br>
            Rep. Legal: ${dados.repContratadaNome}
          </td>
        </tr>
      </table>

      ${
        dados.haveraTestemunhas && dados.testemunhas && dados.testemunhas.length > 0
          ? `
        <p style="margin-top: 25pt;"><strong>Testemunhas:</strong></p>
        <table style="width: 100%; margin-top: 15pt;">
          <tr>
            <td style="width: 48%; border-top: 1px solid #000; padding-top: 4pt;">
              Nome: ${dados.testemunhas[0]?.nome || ''}<br>
              RG: ${dados.testemunhas[0]?.rg || ''}
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; border-top: 1px solid #000; padding-top: 4pt;">
              Nome: ${dados.testemunhas[1]?.nome || ''}<br>
              RG: ${dados.testemunhas[1]?.rg || ''}
            </td>
          </tr>
        </table>
      `
          : ''
      }

      <div class="page-break"></div>
      
      <h2 style="text-align: center; font-size: 13pt;">ANEXO ÚNICO – PROPOSTA COMERCIAL</h2>
      <p>A proposta comercial a seguir integra o presente contrato na forma da Cláusula Terceira. Nos termos do Parágrafo segundo da Cláusula Terceira, somente a versão final da proposta, com todas as opções resolvidas, integra o contrato.</p>
      
      <p><strong>Dados da Proposta:</strong></p>
      <p>Proposta nº: ${dados.anexoPropostaNumero || dados.numeroContrato} | Data: ${dados.anexoPropostaData || dados.dataAssinaturaExtenso} | Validade: ${dados.anexoPropostaValidade || '30 dias'}</p>
      <p>Contratada (consultoria): ${dados.contratadaRazaoSocial || dados.contratadaNome} | Consultor responsável: ${dados.consultorResponsavel || dados.repContratadaNome}</p>
      <p>Contratante (cliente): ${dados.contratanteRazaoSocial || dados.contratanteNome}</p>
      <p>Local/Formato de execução: ${dados.formatoGeral}${dados.localInfraestrutura ? ` - ${dados.localInfraestrutura}` : ''}</p>
      
      <p style="margin-top: 10pt;"><strong>1. Programa contratado: ${dados.anexoProgramaNome || 'PROGRAMA DE DESENVOLVIMENTO EMPRESARIAL IN COMPANY'}</strong></p>
      ${
        dados.anexoModulos && dados.anexoModulos.length > 0
          ? dados.anexoModulos
              .filter((m) => m.titulo || (m.topicos && m.topicos.filter(Boolean).length > 0))
              .map((m) => {
                const titulo = m.carga_horaria
                  ? `${m.titulo || 'Módulo'} (${m.carga_horaria})`
                  : m.titulo || 'Módulo'
                const tops = (m.topicos || []).filter(Boolean)
                const desc = tops.length > 0 ? `: ${tops.join('; ')}.` : ''
                return `<p><strong>${titulo}</strong>${desc}</p>`
              })
              .join('')
          : ''
      }
      
      <p style="margin-top: 10pt;"><strong>2. Cronograma previsto:</strong></p>
      <p>${dados.modulos.map((m) => `${m.servico}: ${m.data_ou_periodo}`).join(' | ')}</p>
      
      <p style="margin-top: 10pt;"><strong>3. Investimento e parcelamento:</strong></p>
      <p>Valor total: R$ ${dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, dividido em ${dados.modulos.length} parcelas.</p>
      
      ${
        dados.despesasViagemAtivas
          ? `
        <p style="margin-top: 10pt;"><strong>4. Despesas de viagem:</strong></p>
        <p>4.1. Transporte: ${dados.despesasTransporte || 'passagem aérea/terrestre reembolsada mediante comprovação.'}</p>
        <p>4.2. Hospedagem: ${dados.despesasHospedagem || 'hotel categoria executiva custeado pela Contratante.'}</p>
        <p>4.3. Alimentação: ${dados.despesasAlimentacao || 'ajuda de custo paga pela Contratante.'}</p>
        <p>4.4. Deslocamento local: ${dados.despesasDeslocamentoLocal || 'sob responsabilidade da Contratante.'}</p>
      `
          : ''
      }

      ${
        dados.modulos.some(
          (m) =>
            m.participantes_max <= 5 &&
            m.participantes_nominais &&
            m.participantes_nominais.length > 0,
        )
          ? `
        <p style="margin-top: 10pt;"><strong>5. Relação Nominal de Participantes:</strong></p>
        ${dados.modulos
          .filter(
            (m) =>
              m.participantes_max <= 5 &&
              m.participantes_nominais &&
              m.participantes_nominais.length > 0,
          )
          .map(
            (m) => `
          <p><strong>${m.servico}:</strong></p>
          <ol>
            ${m.participantes_nominais?.map((p) => `<li>${p.nome_completo} (CPF: ${p.cpf})</li>`).join('')}
          </ol>
        `,
          )
          .join('')}
        <p style="font-size: 9pt; font-style: italic;">Nota: ${NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA}</p>
      `
          : ''
      }

      <div class="page-break"></div>
      <h2 style="text-align: center; font-size: 13pt;">REGISTRO DE ACEITE E AUDITORIA ELETRÔNICA</h2>
      <p>Status: ACEITO E VINCULADO PELAS PARTES</p>
      <p>Data e Hora: ${dados.aceiteDataHora}</p>
      <p>Usuário Emissor: ${dados.aceiteUsuarioNome}</p>
      <p>Endereço IP: ${dados.aceiteIp || '127.0.0.1 (Conexão Segura)'}</p>
      <p>Declaração: "${DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA}"</p>
    </body>
    </html>
  `

  return new Blob([htmlDoc], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
