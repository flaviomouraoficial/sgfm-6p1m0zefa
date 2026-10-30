export interface ProductInfo {
  name: string
  price: number
  timeline: string
}

export interface CommercialTableItem {
  c: string // Condição
  e: string // Estrutura
  v: number // Valor
  carta?: boolean
  fixed?: string
}

export interface PainItem {
  t: string
  d: string
}

export interface ObjectionItem {
  k: string
  t: string
  tr: string
}

export const PRODUCTS: Record<'neomaster' | 'neoprime', Record<string, ProductInfo>> = {
  neomaster: {
    executive: { name: 'Neomaster Executive Club', price: 45000, timeline: '1h00 a 1h10' },
    start: { name: 'Neomaster Start', price: 20000, timeline: '45 a 50 min' },
    diag: { name: 'Diagnóstico Neomaster', price: 5000, timeline: '30 a 35 min' },
  },
  neoprime: {
    mentoria: { name: 'Mentoria Sucessão Familiar', price: 45000, timeline: '1h00 a 1h10' },
    start: { name: 'Neoprime Start', price: 20000, timeline: '45 a 50 min' },
    diag: { name: 'Diagnóstico Neoprime', price: 5000, timeline: '30 a 35 min' },
  },
}

export const TABLES: Record<string, CommercialTableItem[]> = {
  executive: [
    { c: 'Preço Tabela', e: '12x de R$ 4.125 = R$ 49.500', v: 45000 },
    { c: 'Valor Protagonista', e: '6x de R$ 7.700 = R$ 46.200', v: 40000 },
    { c: 'Última Condição', e: 'Entrada R$ 20.000 + 12x de R$ 1.830 = R$ 41.960', v: 41900 },
    {
      c: 'Carta na Manga A',
      e: 'Entrada R$ 15.000 + 6x de R$ 5.534 = R$ 48.204',
      v: 0,
      carta: true,
      fixed: 'R$ 15.000 + 6x R$ 5.534',
    },
    {
      c: 'Carta na Manga B',
      e: 'Entrada R$ 10.000 + 10x de R$ 4.098 = R$ 50.980',
      v: 0,
      carta: true,
      fixed: 'R$ 10.000 + 10x R$ 4.098',
    },
  ],
  mentoria: [
    { c: 'Preço Tabela', e: '12x de R$ 4.125 = R$ 49.500', v: 45000 },
    { c: 'Valor Protagonista', e: '6x de R$ 7.000 = R$ 42.000', v: 42000 },
    { c: 'Última Condição', e: 'Entrada R$ 20.000 + 12x de R$ 1.830 = R$ 41.960', v: 41900 },
    {
      c: 'Carta na Manga A',
      e: 'Entrada R$ 15.000 + 6x de R$ 5.534 = R$ 48.204',
      v: 0,
      carta: true,
      fixed: 'R$ 15.000 + 6x R$ 5.534',
    },
    {
      c: 'Carta na Manga B',
      e: 'Entrada R$ 10.000 + 10x de R$ 4.098 = R$ 50.980',
      v: 0,
      carta: true,
      fixed: 'R$ 10.000 + 10x R$ 4.098',
    },
  ],
  start: [
    { c: 'Preço Tabela', e: '6x de R$ 3.650 = R$ 21.900', v: 20000 },
    { c: 'Valor Protagonista', e: '6x de R$ 3.300 = R$ 19.800, 4 mentorias individuais', v: 18000 },
    { c: 'Última Condição', e: '2x de R$ 9.000, 5 mentorias individuais', v: 18000 },
  ],
  diag: [
    { c: 'Preço Tabela', e: '6x de R$ 935 = R$ 5.610', v: 5000 },
    { c: 'Valor Protagonista', e: '12x de R$ 466,65 = R$ 5.599,80', v: 4500 },
    { c: 'Última Condição', e: 'Entrada R$ 2.500 + 2x de R$ 1.000', v: 4500 },
  ],
}

export const DELIVERABLES: Record<string, string[]> = {
  executive: [
    '12 sessões 1:1',
    '12 encontros em grupo',
    'Imersão com 2 ingressos',
    'FMEDU',
    'Comunidade Neomaster',
    'Grupo individual no WhatsApp',
    'Treinamentos contínuos',
    'Condições especiais',
    'Livro Gestão Protensora',
  ],
  mentoria: [
    'Acompanhamento sob medida com fundadores e sucessores',
    '12 sessões 1:1',
    'Assessment dos sucessores',
    'Diagnóstico de governança familiar',
    'Plano de sucessão executiva',
    'Matriz de papéis e conselho consultivo',
    'FMEDU',
    'Swipe file ilimitado',
    'Livro Sucessão Familiar',
  ],
  start: ['3 mentorias individuais', '3 mentorias em grupo', 'FMEDU', 'Upgrade conforme condição'],
  diag: ['2 reuniões: coleta e imersão', 'Devolutiva com mapa de prioridades'],
}

export const TIMINGS: Record<string, [string, number][]> = {
  executive: [
    ['Introdução e rapport', 5],
    ['Questionário SPIN', 20],
    ['Pitch', 20],
    ['Ancoragem de valor', 2],
    ['Fechamento', 18],
  ],
  mentoria: [
    ['Introdução e rapport', 5],
    ['Questionário SPIN', 20],
    ['Pitch', 20],
    ['Ancoragem de valor', 2],
    ['Fechamento', 18],
  ],
  start: [
    ['Introdução', 5],
    ['Questionário enxuto', 15],
    ['Pitch direto', 15],
    ['Ancoragem', 2],
    ['Fechamento', 11],
  ],
  diag: [
    ['Introdução', 4],
    ['Questionário focal', 11],
    ['Pitch radiografia', 10],
    ['Ancoragem', 2],
    ['Fechamento', 6],
  ],
}

export const PAIN_NEO: PainItem[] = [
  {
    t: 'Dependência do dono',
    d: 'Decisões e operação passam pelo empresário, travando o crescimento.',
  },
  {
    t: 'Despreparo dos gestores',
    d: 'Lideranças sem ferramentas para decidir sem recorrer ao dono.',
  },
  {
    t: 'Conhecimento na cabeça das pessoas',
    d: 'O saber está em pessoas, não em processos documentados.',
  },
  { t: 'Custo da inércia operacional', d: 'Cada mês sem mudança consome caixa, tempo e energia.' },
]

export const PAIN_PRIME: PainItem[] = [
  { t: 'Medo financeiro', d: 'Perder o patrimônio acumulado em décadas de trabalho.' },
  {
    t: 'Medo da inexperiência da nova geração',
    d: 'Decisões impulsivas dos sucessores sem governança.',
  },
  { t: 'Medo de conflito familiar', d: 'Disputas que surgem sem regras claras de sucessão.' },
  {
    t: 'Medo de perder relevância e identidade',
    d: 'O fundador deixa de ser referência do negócio que construiu.',
  },
  {
    t: 'Argumento central',
    d: 'Enquanto a governança é postergada, os filhos já tomam decisões de vida e consolidam vícios que custarão milhões.',
  },
]

export const OBJECTIONS: ObjectionItem[] = [
  {
    k: 'caro',
    t: 'Está caro',
    tr: 'Acolha: “Faz sentido olhar o investimento com cuidado.” Ancore valor: “Pense num imóvel avaliado em R$ 1.000.000 que você vende por R$ 400.000. O preço não está errado; o que se perde é o valor.” Pergunte: “Comparado ao custo de manter o problema, quanto isso representa por ano para você?”',
  },
  {
    k: 'pensar',
    t: 'Preciso pensar',
    tr: 'Reformule: “Claro. Antes de decidir, o que exatamente você precisa pensar: o valor, o momento ou se o método resolve o seu caso?” Mostre o custo da inércia: “Cada mês adiado mantém o problema funcionando contra você.” Pergunte: “O que, dos três pontos, pesa mais?”',
  },
  {
    k: 'socio',
    t: 'Preciso falar com meu sócio ou cônjuge',
    tr: 'Acolha: “Decisão compartilhada é o certo.” Proponha agenda conjunta: “Podemos marcar 30 minutos com vocês dois nesta semana?” Prepare o resumo: “Diga a ele que o foco é tirar você da operação e reduzir o risco do negócio, com um mapa de prioridades antes de qualquer investimento.” Pergunte: “Qual dia funciona para os dois?”',
  },
  {
    k: 'momento',
    t: 'Agora não é o momento',
    tr: 'Reformule: “O momento ideal raramente chega sozinho.” Mostre o custo do adiamento: “Quanto a empresa perdeu nos últimos seis meses por falta de estrutura?” Pergunte: “O que precisaria ser verdade para que este fosse o momento?”',
  },
  {
    k: 'consultoria',
    t: 'Já tentei consultoria e não funcionou',
    tr: 'Acolha: “Entendo a frustração, e é justamente por isso que começamos por um diagnóstico.” Diferencie: “Teoria de prateleira não resolve; ferramenta prática, aplicada à sua operação, resolve.” Pergunte: “O que não funcionou naquela experiência?”',
  },
  {
    k: 'tempo',
    t: 'Não tenho tempo',
    tr: 'Reformule: “Justamente por isso o programa existe. O dono sem tempo é o sintoma do problema, não a justificativa para não resolvê-lo.” Pergunte: “Quantas horas por semana vão para tarefas que poderiam ser de outra pessoa?”',
  },
  {
    k: 'email',
    t: 'Me manda uma proposta por e-mail',
    tr: 'Acolha: “Envio sim, e uma proposta genérica não resolve o seu caso.” Proponha: “Quinze minutos de conversa valem mais que qualquer documento; assim monto a proposta sobre o seu cenário real.” Pergunte: “Podemos fechar um horário de 15 minutos ainda esta semana?”',
  },
  {
    k: 'sozinho',
    t: 'Vou fazer sozinho',
    tr: 'Pergunte: “Quanto tempo você já gastou tentando resolver isso sozinho?” Reformule: “Fazer sozinho é possível, mas cada mês custa caixa e atenção. O método já foi testado em 18 anos de operação real.” Pergunte: “Qual foi o resultado prático até aqui?”',
  },
  {
    k: 'longo',
    t: 'Programa muito longo',
    tr: 'Reformule: “Não é um projeto com começo e fim; é um modelo contínuo, com no mínimo 6 meses, que se renova conforme a empresa amadurece.” Mostre o plano de entrada: “Podemos começar por um diagnóstico e decidir o passo seguinte com base em resultados.” Pergunte: “Qual duração faria sentido para você?”',
  },
  {
    k: 'conhece',
    t: 'Não conheço você',
    tr: 'Acolha: “Faz todo sentido querer conhecer quem vai conduzir seu negócio.” Traga credenciais: “São 18 anos de experiência, três livros publicados, participação em conselhos consultivos e cases de empresas de diferentes segmentos.” Pergunte: “O que você gostaria de saber sobre a nossa trajetória?”',
  },
]

export interface MeetingFormData {
  // Etapa 1
  leadName: string
  company: string
  segment: string
  employees: string
  tenure: string
  channel: string
  interest: 'neomaster' | 'neoprime' | 'indefinida' | ''
  participants: string
  decisor: 'sim' | 'nao' | ''

  // Etapa 2
  revenue: 'ate1' | '1a5' | '5a20' | '20a50' | 'acima50' | ''
  urgency: 'baixo' | 'medio' | 'alto' | 'critico' | ''
  history: 'funcionou' | 'nao_funcionou' | 'nunca' | ''
  liquidity: 'confortavel' | 'apertada' | 'sem' | ''
  readiness: 'aberto' | 'reconhece' | 'cetico' | 'vitimista' | ''

  dorPrincipal: string
  sonoFuturo: string
  horasOperacao: string
  sair15Dias: string
  saidaGestor: string
  custoRotatividade: string
  cenario12Meses: string

  // Etapa 4
  compromissos: string
  numerosCitados: string
  termosCliente: string
  indicacoes: string
  proximoPasso: string
  dataProximoContato: string

  // Etapa 5
  resultado: string
  condicaoEscolhida: string
  formaPagamento: string
}

export const INITIAL_FORM_DATA: MeetingFormData = {
  leadName: '',
  company: '',
  segment: '',
  employees: '',
  tenure: '',
  channel: '',
  interest: '',
  participants: '',
  decisor: '',

  revenue: '',
  urgency: '',
  history: '',
  liquidity: '',
  readiness: '',

  dorPrincipal: '',
  sonoFuturo: '',
  horasOperacao: '',
  sair15Dias: '',
  saidaGestor: '',
  custoRotatividade: '',
  cenario12Meses: '',

  compromissos: '',
  numerosCitados: '',
  termosCliente: '',
  indicacoes: '',
  proximoPasso: '',
  dataProximoContato: '',

  resultado: '',
  condicaoEscolhida: '',
  formaPagamento: '',
}

export interface RecommendationTier {
  line: 'neomaster' | 'neoprime' | 'indefinida'
  key: string // diag | start | executive | mentoria
  reason: string
}

export function determineTier(data: MeetingFormData): RecommendationTier {
  const line = data.interest
  const liq = data.liquidity
  const rd = data.readiness
  const hasLine = line && line !== 'indefinida'

  if (!hasLine) {
    return {
      line: 'indefinida',
      key: 'diag',
      reason:
        'A linha de interesse ainda não está definida. O Diagnóstico é a porta de entrada segura; defina a linha (Neomaster ou Neoprime) para liberar o produto principal.',
    }
  }

  if (rd === 'cetico' || liq === 'sem') {
    return {
      line,
      key: 'diag',
      reason:
        'Perfil cético ou sem liquidez. Não forçar o programa principal. Diagnóstico como próximo passo, com possível upsell na devolutiva.',
    }
  }

  if (rd === 'reconhece' || liq === 'apertada') {
    return {
      line,
      key: 'start',
      reason:
        'Reconhece o problema mas desconfia, ou tem liquidez apertada. Start com downsell consciente, e conclusão conduzindo ao ciclo anual.',
    }
  }

  if (line === 'neoprime' && rd === 'aberto' && liq === 'confortavel') {
    return {
      line,
      key: 'mentoria',
      reason:
        'Linha Neoprime, prontidão alta e liquidez confortável. Mentoria Sucessão Familiar como programa principal.',
    }
  }

  if (line === 'neomaster' && rd === 'aberto' && liq === 'confortavel') {
    return {
      line,
      key: 'executive',
      reason:
        'Linha Neomaster, prontidão alta e liquidez confortável. Executive Club como programa principal.',
    }
  }

  if (rd === 'vitimista') {
    return {
      line,
      key: 'start',
      reason:
        'Perfil vitimista ainda sem clareza de responsabilidade. Start para construir confiança antes do programa principal.',
    }
  }

  return {
    line,
    key: 'start',
    reason: 'Prontidão e liquidez intermediárias. Start como recomendação principal.',
  }
}

export function computePains(tier: RecommendationTier, data: MeetingFormData): PainItem[] {
  const list = tier.line === 'neoprime' ? PAIN_PRIME.slice() : PAIN_NEO.slice()
  const allText = [
    data.dorPrincipal,
    data.sonoFuturo,
    data.horasOperacao,
    data.sair15Dias,
    data.saidaGestor,
    data.custoRotatividade,
    data.cenario12Meses,
  ]
    .join(' ')
    .toLowerCase()

  const out: PainItem[] = []

  if (tier.line === 'neoprime') {
    if (/patrim|dinheiro|caixa|investi/.test(allText)) out.push(list[0])
    if (/filh|geração|sucessor|neto|jovem/.test(allText)) out.push(list[1])
    if (/conflit|irm|briga|família|familia/.test(allText)) out.push(list[2])
    if (/relevân|identidade|lugar|respeito/.test(allText)) out.push(list[3])
    if (/sucess|12 meses|nada mudar|patrimônio|patrim/.test(allText) || out.length < 2) {
      out.push(list[4])
    }
  } else {
    if (/dono|operação|operacional|horas|sair|ausên/.test(allText)) out.push(list[0])
    if (/gestor|líder|liderança|demiss|pedir/.test(allText)) out.push(list[1])
    if (/cabeça|conhecimento|processo|pessoas/.test(allText)) out.push(list[2])
    if (/custou|custo|caixa|rotatividade|tempo|desgaste|12 meses/.test(allText)) out.push(list[3])
  }

  if (out.length === 0) return list.slice(0, 2)

  const seen: Record<string, boolean> = {}
  return out.filter((p) => {
    if (seen[p.t]) return false
    seen[p.t] = true
    return true
  })
}

export function computeObjections(data: MeetingFormData): ObjectionItem[] {
  const hist = data.history
  const rd = data.readiness
  const out: string[] = []

  if (hist === 'nao_funcionou' || hist === 'funcionou') out.push('consultoria')
  if (rd === 'cetico') out.push('conhece')
  if (rd === 'reconhece' || rd === 'cetico') out.push('caro')
  if (data.liquidity === 'sem' || data.liquidity === 'apertada') out.push('momento')
  if (rd === 'reconhece') out.push('pensar')
  out.push('socio')
  out.push('tempo')
  out.push('email')
  out.push('longo')

  const seen: Record<string, boolean> = {}
  const res = out.filter((k) => {
    if (seen[k]) return false
    seen[k] = true
    return true
  })

  return res.map((k) => OBJECTIONS.find((o) => o.k === k)).filter(Boolean) as ObjectionItem[]
}

export function getProductDetails(tier: RecommendationTier): {
  product: ProductInfo
  productName: string
  price: number
  tableKey: string
  anchorText: string
} {
  const prodMap = PRODUCTS[tier.line === 'neoprime' ? 'neoprime' : 'neomaster']
  const product = prodMap[tier.key] || PRODUCTS.neomaster.diag
  const tableKey = tier.line === 'indefinida' ? 'diag' : tier.key
  const productName = tier.line === 'indefinida' ? 'Diagnóstico (linha indefinida)' : product.name
  const price = product.price

  const anchorText =
    tier.line === 'neoprime'
      ? 'Imagine um imóvel avaliado em R$ 1.000.000 vendido por R$ 600.000. Hoje o valor acumulado do acompanhamento em consultorias tradicionais supera R$ 150.000. O investimento protege o patrimônio que você levou décadas para construir.'
      : 'Imagine um imóvel avaliado em R$ 1.000.000 vendido por R$ 400.000. O valor de mercado do pacote supera R$ 90.000. O investimento devolve a liberdade e o tempo que hoje estão presos à operação.'

  return { product, productName, price, tableKey, anchorText }
}

export function calculateQualificationPercentage(data: MeetingFormData): number {
  const fields = [
    !!data.leadName,
    !!data.company,
    !!data.segment,
    !!data.employees,
    !!data.tenure,
    !!data.channel,
    !!data.interest,
    !!data.participants,
    !!data.decisor,
    !!data.revenue,
    !!data.urgency,
    !!data.history,
    !!data.liquidity,
    !!data.readiness,
    !!data.dorPrincipal,
  ]
  const count = fields.filter(Boolean).length
  return Math.round((count / fields.length) * 100)
}

export function buildMeetingSummary(
  data: MeetingFormData,
  tier: RecommendationTier,
  formatBRL: (v: number) => string,
): string {
  const { product } = getProductDetails(tier)
  const pains =
    computePains(tier, data)
      .map((p) => `- ${p.t}`)
      .join('\n') || '- Nenhuma identificada'
  const objs =
    computeObjections(data)
      .slice(0, 4)
      .map((o) => `- ${o.t}`)
      .join('\n') || '- Nenhuma detectada'

  const lines = [
    'ASSISTENTE COMERCIAL — NEOMASTER E NEOPRIME',
    'Resumo da reunião',
    '',
    'IDENTIFICAÇÃO',
    `Lead: ${data.leadName || '—'}`,
    `Empresa: ${data.company || '—'}`,
    `Segmento: ${data.segment || '—'}`,
    `Colaboradores: ${data.employees || '—'}`,
    `Tempo de empresa: ${data.tenure || '—'}`,
    `Canal de origem: ${data.channel || '—'}`,
    `Linha de interesse: ${
      data.interest === 'neomaster'
        ? 'Neomaster'
        : data.interest === 'neoprime'
          ? 'Neoprime'
          : data.interest === 'indefinida'
            ? 'Ainda não definido'
            : '—'
    }`,
    `Participantes: ${data.participants || '—'}`,
    `Decisor presente: ${data.decisor === 'sim' ? 'Sim' : data.decisor === 'nao' ? 'Não' : '—'}`,
    '',
    'QUALIFICAÇÃO',
    `Faturamento anual: ${formatRevenueLabel(data.revenue)}`,
    `Urgência: ${formatUrgencyLabel(data.urgency)}`,
    `Consultoria anterior: ${formatHistoryLabel(data.history)}`,
    `Capacidade de investimento: ${formatLiquidityLabel(data.liquidity)}`,
    `Prontidão emocional: ${formatReadinessLabel(data.readiness)}`,
    `Principal dor: ${data.dorPrincipal || '—'}`,
    `Preocupação com o futuro: ${data.sonoFuturo || '—'}`,
    `Horas em operação: ${data.horasOperacao || '—'}`,
    `Ausência de 15 dias: ${data.sair15Dias || '—'}`,
    `Saída de gestor de confiança: ${data.saidaGestor || '—'}`,
    `Custo de rotatividade: ${data.custoRotatividade || '—'}`,
    `Cenário sem mudança em 12 meses: ${data.cenario12Meses || '—'}`,
    '',
    'RECOMENDAÇÃO',
    `Produto: ${
      tier.line === 'indefinida' ? 'Diagnóstico (linha a definir)' : product.name
    } — tabela ${formatBRL(product.price)}`,
    `Racional: ${tier.reason}`,
    '',
    'DORES TOCADAS',
    pains,
    '',
    'OBJEÇÕES DETECTADAS E TRATATIVAS',
    objs,
    '',
    'ANOTAÇÕES',
    `Compromissos: ${data.compromissos || '—'}`,
    `Números citados: ${data.numerosCitados || '—'}`,
    `Termos do cliente: ${data.termosCliente || '—'}`,
    `Indicações: ${data.indicacoes || '—'}`,
    '',
    'FECHAMENTO',
    `Resultado: ${data.resultado || '—'}`,
    `Condição escolhida: ${data.condicaoEscolhida || '—'}`,
    `Forma de pagamento: ${data.formaPagamento || '—'}`,
    `Próximo passo: ${data.proximoPasso || '—'}`,
    `Data do próximo contato: ${data.dataProximoContato || '—'}`,
  ]

  return lines.join('\n')
}

export function formatRevenueLabel(r: string): string {
  const map: Record<string, string> = {
    ate1: 'Até 1 milhão',
    '1a5': '1 a 5 milhões',
    '5a20': '5 a 20 milhões',
    '20a50': '20 a 50 milhões',
    acima50: 'Acima de 50 milhões',
  }
  return map[r] || '—'
}

export function formatUrgencyLabel(u: string): string {
  const map: Record<string, string> = {
    baixo: 'Baixo',
    medio: 'Médio',
    alto: 'Alto',
    critico: 'Crítico',
  }
  return map[u] || '—'
}

export function formatHistoryLabel(h: string): string {
  const map: Record<string, string> = {
    funcionou: 'Sim, funcionou',
    nao_funcionou: 'Sim, não funcionou',
    nunca: 'Nunca',
  }
  return map[h] || '—'
}

export function formatLiquidityLabel(l: string): string {
  const map: Record<string, string> = {
    confortavel: 'Confortável',
    apertada: 'Apertada mas viável',
    sem: 'Sem liquidez no momento',
  }
  return map[l] || '—'
}

export function formatReadinessLabel(r: string): string {
  const map: Record<string, string> = {
    aberto: 'Aberto e ciente do problema',
    reconhece: 'Reconhece mas desconfia',
    cetico: 'Cético',
    vitimista: 'Vitimista',
  }
  return map[r] || '—'
}
