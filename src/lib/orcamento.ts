// ============================================================
// Motor de cálculo do Farol Comercial (peça 2 — precificação).
// Lib PURA: sem dependências de PocketBase/React — testável.
// Regra de ouro: o preço NUNCA é digitado — só derivado.
// ============================================================

export type TipoHora = 'entrega' | 'preparacao' | 'deslocamento' | 'relatoria'

export const TIPOS_HORA: { value: TipoHora; label: string }[] = [
  { value: 'entrega', label: 'Entrega' },
  { value: 'preparacao', label: 'Preparação' },
  { value: 'deslocamento', label: 'Deslocamento' },
  { value: 'relatoria', label: 'Relatoria/Devolutiva' },
]

export const TIPO_HORA_LABEL: Record<TipoHora, string> = {
  entrega: 'Entrega',
  preparacao: 'Preparação',
  deslocamento: 'Deslocamento',
  relatoria: 'Relatoria/Devolutiva',
}

/** Só hora de entrega é faturável; as demais cobrem custo (não geram receita direta). */
export const isHoraFaturavel = (t: TipoHora) => t === 'entrega'

export interface RecursoCusto {
  id: string
  profissional_id?: string
  profissional_nome: string
  tipo_hora: TipoHora
  custo_hora: number
  ativo?: boolean
  observacoes?: string
}

export interface ComponenteCusto {
  id: string
  nome: string
  categoria?: string
  unidade?: string
  valor_padrao: number
  reembolsavel?: boolean
  ativo?: boolean
}

/** Overhead/imposto por empresa — defaults aprovados pelo cliente (25% / 8% / 2,0×). */
export interface OverheadConfig {
  id?: string
  empresa_id?: string
  pct_administrativo: number
  pct_financeiro: number
  pct_comercial: number
  pct_imposto: number
  fator_preparacao: number
}

export const OVERHEAD_DEFAULT: OverheadConfig = {
  pct_administrativo: 10,
  pct_financeiro: 8,
  pct_comercial: 7,
  pct_imposto: 8,
  fator_preparacao: 2.0,
}

export interface AlcadaDesconto {
  id: string
  perfil_id?: string
  perfil_nome: string
  pct_max: number
}

export interface ModeloCobranca {
  id: string
  nome: string
  descricao?: string
  ativo?: boolean
}

export interface EscopoModulo {
  id: string
  nome: string
  descricao?: string
  custo_padrao?: number
  preco_padrao?: number
  ativo?: boolean
}

export interface LinhaHora {
  tipo: 'hora'
  modulo_nome?: string
  recurso_id?: string
  recurso_nome: string
  profissional_id?: string
  tipo_hora: TipoHora
  horas: number
  custo_hora: number
}

export interface LinhaComponente {
  tipo: 'componente'
  modulo_nome?: string
  componente_id?: string
  componente_nome: string
  unidade: string
  quantidade: number
  valor_unitario: number
  reembolsavel?: boolean
}

export type LinhaOrcamento = LinhaHora | LinhaComponente

export interface ConfigCalculo extends OverheadConfig {
  /** Fator de segurança sobre o custo para o preço mínimo (default 1,15). */
  fator_seguranca: number
  /** Margem alvo em % (digitada). */
  margem_alvo_pct: number
}

export const FATOR_SEGURANCA_DEFAULT = 1.15

export interface LinhaCalculada {
  tipo: 'hora' | 'componente'
  descricao: string
  modulo_nome?: string
  detalhe: string
  custo: number
  faturavel: boolean
  reembolsavel?: boolean
  derivada?: boolean
}

export interface ResultadoCalculo {
  custo_entrega: number
  custo_nao_faturavel: number
  custo_preparacao_derivado: number
  custo_direto: number
  overhead_pct: number
  custo_com_overhead: number
  total_reembolsavel: number
  preco_minimo: number
  preco_sugerido: number
  desconto_pct: number
  preco_final: number
  total_ao_cliente: number
  margem_real_pct: number
  ponto_equilibrio: number | null
  ponto_equilibrio_unidade: string | null
  linhas: LinhaCalculada[]
  avisos: string[]
}

export interface ParamsCalculo {
  linhas: LinhaOrcamento[]
  config: ConfigCalculo
  /** Rate de PREPARAÇÃO por profissional (para o fator 2,0× sobre a hora de entrega). */
  ratesPreparacao?: Record<string, number>
  descontoPct?: number
  modeloNome?: string
  diasEntrega?: number
  participantes?: number
}

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0)

/**
 * Cálculo completo do orçamento. Convenções aprovadas pelo cliente:
 * - Overhead 25% (adm 10 + fin 8 + comercial 7) aplicado sobre o custo direto;
 * - Imposto (8% Simples) incide sobre o PREÇO — preço líquido precisa cobrir custo+overhead;
 * - Fator de preparação (2,0×): cada hora de ENTREGA embute horas de preparação
 *   (rate do mesmo profissional); se já existe linha manual de preparação do
 *   mesmo profissional, a derivação é pulada (evita contagem em dobro);
 * - Viagem/componentes reembolsáveis: repassados ao cliente fora da margem;
 * - Preço mínimo = custo c/ overhead × fator de segurança ÷ (1 − imposto);
 * - Preço sugerido = custo c/ overhead ÷ (1 − imposto − margem alvo).
 */
export function calcularOrcamento(params: ParamsCalculo): ResultadoCalculo {
  const { linhas, config, ratesPreparacao = {} } = params
  const descontoPct = Math.max(0, num(params.descontoPct))
  const avisos: string[] = []
  const calculadas: LinhaCalculada[] = []

  let custoEntrega = 0
  let custoNaoFaturavel = 0
  let custoPreparacaoManual = 0
  let totalReembolsavel = 0
  let horasEntrega = 0

  const temPreparacaoManual = new Set(
    linhas
      .filter((l): l is LinhaHora => l.tipo === 'hora' && l.tipo_hora === 'preparacao')
      .map((l) => l.profissional_id || l.recurso_nome),
  )

  for (const l of linhas) {
    if (l.tipo === 'hora') {
      const horas = Math.max(0, num(l.horas))
      const custo = horas * Math.max(0, num(l.custo_hora))
      const faturavel = isHoraFaturavel(l.tipo_hora)
      calculadas.push({
        tipo: 'hora',
        descricao: l.recurso_nome,
        modulo_nome: l.modulo_nome,
        detalhe: `${TIPO_HORA_LABEL[l.tipo_hora]} · ${horas}h × ${fmtMoeda(l.custo_hora)}`,
        custo,
        faturavel,
      })
      if (faturavel) {
        custoEntrega += custo
        horasEntrega += horas
      } else {
        custoNaoFaturavel += custo
        if (l.tipo_hora === 'preparacao') custoPreparacaoManual += custo
      }
    } else {
      const qtd = Math.max(0, num(l.quantidade))
      const custo = qtd * Math.max(0, num(l.valor_unitario))
      const reemb = Boolean(l.reembolsavel)
      calculadas.push({
        tipo: 'componente',
        descricao: l.componente_nome,
        modulo_nome: l.modulo_nome,
        detalhe: `${qtd} ${l.unidade || 'un'} × ${fmtMoeda(l.valor_unitario)}`,
        custo,
        faturavel: false,
        reemb: reemb,
      } as LinhaCalculada & { reemb: boolean })
      if (reemb) totalReembolsavel += custo
      else custoNaoFaturavel += custo
    }
  }

  // Fator de preparação derivado: entrega × fator × rate de preparação do profissional
  let custoPreparacaoDerivado = 0
  for (const l of linhas) {
    if (l.tipo !== 'hora' || l.tipo_hora !== 'entrega') continue
    const chave = l.profissional_id || l.recurso_nome
    if (temPreparacaoManual.has(chave)) continue
    const ratePrep = (l.profissional_id && ratesPreparacao[l.profissional_id]) || l.custo_hora
    const custo = Math.max(0, num(l.horas)) * config.fator_preparacao * Math.max(0, ratePrep)
    custoPreparacaoDerivado += custo
    calculadas.push({
      tipo: 'hora',
      descricao: l.recurso_nome,
      modulo_nome: l.modulo_nome,
      detalhe: `Preparação derivada · ${fmtNum(config.fator_preparacao)}× ${fmtNum(l.horas)}h × ${fmtMoeda(ratePrep)}`,
      custo,
      faturavel: false,
      derivada: true,
    })
  }

  const custoDireto = custoEntrega + custoNaoFaturavel + custoPreparacaoDerivado
  const overheadPct =
    Math.max(0, num(config.pct_administrativo)) +
    Math.max(0, num(config.pct_financeiro)) +
    Math.max(0, num(config.pct_comercial))
  const custoComOverhead = custoDireto * (1 + overheadPct / 100)

  const imposto = Math.min(99, Math.max(0, num(config.pct_imposto))) / 100
  const fatorSeguranca = Math.max(1, num(config.fator_seguranca) || FATOR_SEGURANCA_DEFAULT)
  const margemAlvo = Math.min(95, Math.max(0, num(config.margem_alvo_pct))) / 100

  const precoMinimo = (custoComOverhead * fatorSeguranca) / (1 - imposto)

  const denomSugerido = 1 - imposto - margemAlvo
  let precoSugerido: number
  if (denomSugerido <= 0.05) {
    precoSugerido = precoMinimo
    avisos.push('Margem alvo + imposto altos demais — preço sugerido igualado ao preço mínimo.')
  } else {
    precoSugerido = custoComOverhead / denomSugerido
  }

  const precoFinal = precoSugerido * (1 - descontoPct / 100)
  const totalAoCliente = precoFinal + totalReembolsavel

  let margemReal = 0
  if (precoFinal > 0) {
    margemReal = ((precoFinal * (1 - imposto) - custoComOverhead) / precoFinal) * 100
  }
  if (custoDireto <= 0)
    avisos.push('Nenhuma linha de custo composta — calcule o escopo do projeto.')
  if (precoFinal > 0 && precoFinal < precoMinimo)
    avisos.push('Preço final abaixo do preço mínimo (custo × segurança).')

  // Ponto de equilíbrio conforme o modelo de cobrança (implementado: fechado, dia, participante)
  let pontoEquilibrio: number | null = null
  let pontoUnidade: string | null = null
  const modelo = (params.modeloNome || '').toLowerCase()
  if (custoComOverhead > 0 && precoFinal > 0) {
    if (modelo.includes('participante')) {
      const participantes = num(params.participantes)
      if (participantes > 0) {
        pontoUnidade = 'participantes'
        pontoEquilibrio = Math.ceil(precoMinimo / (precoFinal / participantes))
      }
    } else if (modelo.includes('dia')) {
      const dias = num(params.diasEntrega)
      if (dias > 0) {
        pontoUnidade = 'dias de entrega'
        pontoEquilibrio = Math.ceil(precoMinimo / (precoFinal / dias))
      }
    } else if (modelo.includes('fechado')) {
      pontoUnidade = null
    } else {
      pontoUnidade = null
      avisos.push('Ponto de equilíbrio para este modelo de cobrança: em breve.')
    }
  }

  return {
    custo_entrega: custoEntrega,
    custo_nao_faturavel: custoNaoFaturavel,
    custo_preparacao_derivado: custoPreparacaoDerivado,
    custo_direto: custoDireto,
    overhead_pct: overheadPct,
    custo_com_overhead: custoComOverhead,
    total_reembolsavel: totalReembolsavel,
    preco_minimo: precoMinimo,
    preco_sugerido: precoSugerido,
    desconto_pct: descontoPct,
    preco_final: precoFinal,
    total_ao_cliente: totalAoCliente,
    margem_real_pct: margemReal,
    ponto_equilibrio: pontoEquilibrio,
    ponto_equilibrio_unidade: pontoUnidade,
    linhas: calculadas,
    avisos,
  }
}

/** Alçada de desconto do usuário logado: admin não tem teto; perfil sem alçada = 0%. */
export function limiteDescontoUsuario(user: any, alcadas: AlcadaDesconto[]): number | null {
  if (!user) return 0
  const isAdmin =
    user.role === 'admin' ||
    user.email === 'flavio@trendconsultoria.com.br' ||
    user.email === 'admin@grupoflaviomoura.com.br'
  if (isAdmin) return null // sem limite
  const alvo = String(user.role || '').toLowerCase()
  const achada = alcadas.find((a) => String(a.perfil_nome || '').toLowerCase() === alvo)
  return achada ? num(achada.pct_max) : 0
}

export function fmtMoeda(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export function fmtNum(v: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v || 0)
}

export function fmtPct(v: number): string {
  return `${fmtNum(v)}%`
}
