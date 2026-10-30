import {
  calcularMultaModuloIndividual,
  calcularCancelamentoProgramaCompleto,
  calcularAtrasoPagamento,
} from './contratos-motor-calculo'
import { ModuloContrato } from './contratos-types'

export function testMotorCalculo() {
  // Teste 1: Antecedência > 30 dias -> 0%
  const res35 = calcularMultaModuloIndividual(4000, '2026-11-14', '2026-10-01')
  console.assert(res35.percentualMulta === 0, 'Falha teste >30 dias')
  console.assert(res35.valorMulta === 0, 'Falha valor >30 dias')

  // Teste 2: Antecedência entre 8 e 30 dias -> 50%
  const res15 = calcularMultaModuloIndividual(4000, '2026-11-14', '2026-10-30')
  console.assert(res15.percentualMulta === 50, 'Falha teste 8..30 dias')
  console.assert(res15.valorMulta === 2000, 'Falha valor 50%')

  // Teste 3: Antecedência <= 7 dias -> 100%
  const res5 = calcularMultaModuloIndividual(4000, '2026-11-14', '2026-11-10')
  console.assert(res5.percentualMulta === 100, 'Falha teste <=7 dias')
  console.assert(res5.valorMulta === 4000, 'Falha valor 100%')

  // Teste 4: Atraso de pagamento (2% + 1% a.m. pro rata)
  const resAtraso = calcularAtrasoPagamento(4000, '2026-10-10', '2026-10-25')
  console.assert(resAtraso.valorMulta === 80, 'Multa de 2% sobre 4000 deve ser 80')
  console.assert(resAtraso.diasAtraso === 15, 'Dias de atraso devem ser 15')
  // Juros: 4000 * (0.01 / 30 * 15) = 20
  console.assert(Math.round(resAtraso.valorJuros) === 20, 'Juros 15 dias deve ser ~20')

  return true
}
