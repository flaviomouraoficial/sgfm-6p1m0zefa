import { ModuloContrato } from './contratos-types'

/**
 * PARTE 9 — MOTOR DE CÁLCULO DE ENCARGOS
 *
 * 1. Cancelamento/reagendamento de módulo individual por iniciativa da contratante:
 *    - antecedência > 30 dias → multa zero (0%)
 *    - antecedência ≤ 30 e > 7 dias → 50% da parcela
 *    - antecedência < 7 dias (ou ≤ 7) → 100% da parcela
 *
 * 2. Cancelamento do programa completo:
 *    - Multas acima sobre parcelas com data prevista em até 30 dias do cancelamento
 *    - + verba rescisória de 50% das parcelas vincendas sobre as demais (fora dos 30 dias),
 *      SEM cumulação sobre a mesma parcela.
 *
 * 3. Atraso de pagamento:
 *    - Multa de 2% sobre o valor da parcela
 *    - Juros de mora de 1% ao mês pro rata tempore
 *    - Correção monetária (ilustrativa/padrão)
 */

export function parseDateBRorISO(dateStr: string): Date | null {
  if (!dateStr) return null
  const clean = dateStr.trim()
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [y, m, d] = clean.substring(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  // Try DD/MM/YYYY
  const brMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (brMatch) {
    const d = Number(brMatch[1])
    const m = Number(brMatch[2]) - 1
    const y = Number(brMatch[3])
    return new Date(y, m, d)
  }
  return null
}

export function diffDays(d1: Date, d2: Date): number {
  const ms1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const ms2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate())
  return Math.round((ms1 - ms2) / (1000 * 60 * 60 * 24))
}

export function calcularMultaModuloIndividual(
  valorParcela: number,
  dataModuloStr: string,
  dataCancelamentoStr: string,
) {
  const dModulo = parseDateBRorISO(dataModuloStr)
  const dCanc = parseDateBRorISO(dataCancelamentoStr)

  if (!dModulo || !dCanc) {
    return {
      diasAntecedencia: 0,
      percentualMulta: 0,
      valorMulta: 0,
      explicacao: 'Datas inválidas para cálculo.',
    }
  }

  const dias = diffDays(dModulo, dCanc)

  let percentual = 0
  let faixa = ''

  if (dias > 30) {
    percentual = 0
    faixa = 'Superior a 30 dias de antecedência (Multa Zero - reagendamento sem custo)'
  } else if (dias > 7 && dias <= 30) {
    percentual = 50
    faixa = 'Entre 8 e 30 dias de antecedência (Multa de 50% da parcela)'
  } else {
    // dias <= 7 ou já passado
    percentual = 100
    faixa = 'Inferior ou igual a 7 dias de antecedência (Multa integral de 100% da parcela)'
  }

  const valorMulta = (valorParcela * percentual) / 100

  return {
    diasAntecedencia: dias,
    percentualMulta: percentual,
    valorMulta,
    explicacao: faixa,
  }
}

export function calcularCancelamentoProgramaCompleto(
  modulos: ModuloContrato[],
  dataCancelamentoStr: string,
) {
  const dCanc = parseDateBRorISO(dataCancelamentoStr)
  if (!dCanc) {
    return {
      itens: [],
      totalMultas: 0,
      totalRescisoria: 0,
      totalGeral: 0,
    }
  }

  let totalMultas = 0
  let totalRescisoria = 0

  const itens = modulos.map((m) => {
    // Referência: data_referencia_inicio ou primeira data encontrada em data_ou_periodo
    const refDataStr = m.data_referencia_inicio || m.data_ou_periodo
    const dMod = parseDateBRorISO(refDataStr)

    if (!dMod) {
      return {
        moduloId: m.id,
        servico: m.servico,
        valorParcela: m.valor_parcela,
        dias: 0,
        regime: 'Indeterminado (data não reconhecida)',
        percentual: 0,
        valorEncargo: 0,
      }
    }

    const dias = diffDays(dMod, dCanc)

    if (dias <= 30) {
      // Intervalo de 30 dias ou menos: aplica regime de multa compensatória
      let percentual = 100
      if (dias > 7) {
        percentual = 50
      } else if (dias < 0) {
        // Já realizado ou atrasado
        percentual = 100
      }
      const valor = (m.valor_parcela * percentual) / 100
      totalMultas += valor
      return {
        moduloId: m.id,
        servico: m.servico,
        valorParcela: m.valor_parcela,
        dias,
        regime: `Multa compensatória (${percentual}%) - previsto em até 30 dias`,
        percentual,
        valorEncargo: valor,
      }
    } else {
      // Fora do intervalo de 30 dias: verba rescisória de 50% das parcelas vincendas
      const percentual = 50
      const valor = (m.valor_parcela * percentual) / 100
      totalRescisoria += valor
      return {
        moduloId: m.id,
        servico: m.servico,
        valorParcela: m.valor_parcela,
        dias,
        regime: 'Verba rescisória (50% vincenda) - sem cumulação',
        percentual,
        valorEncargo: valor,
      }
    }
  })

  return {
    itens,
    totalMultas,
    totalRescisoria,
    totalGeral: totalMultas + totalRescisoria,
  }
}

export function calcularAtrasoPagamento(
  valorParcela: number,
  dataVencimentoStr: string,
  dataSimuladaPagamentoStr: string,
) {
  const dVenc = parseDateBRorISO(dataVencimentoStr)
  const dPag = parseDateBRorISO(dataSimuladaPagamentoStr)

  if (!dVenc || !dPag) {
    return {
      diasAtraso: 0,
      multaPercent: 2,
      valorMulta: valorParcela * 0.02,
      jurosPercent: 0,
      valorJuros: 0,
      valorTotal: valorParcela * 1.02,
    }
  }

  const diasAtraso = Math.max(0, diffDays(dPag, dVenc))

  // Multa fixa de 2%
  const valorMulta = valorParcela * 0.02

  // Juros de mora de 1% ao mês (0.03333% ao dia) pro rata tempore
  const taxaDiaria = 0.01 / 30
  const jurosProRata = valorParcela * (taxaDiaria * diasAtraso)

  return {
    diasAtraso,
    multaPercent: 2,
    valorMulta,
    jurosPercent: diasAtraso * taxaDiaria * 100,
    valorJuros: jurosProRata,
    valorTotal: valorParcela + valorMulta + jurosProRata,
  }
}
