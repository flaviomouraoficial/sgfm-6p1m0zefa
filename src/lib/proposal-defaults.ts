import { format } from 'date-fns'

export const DEFAULT_TEXTO_INSTITUCIONAL = `A Trend Consultoria é uma empresa especializada em consultoria empresarial e desenvolvimento de lideranças, com mais de 15 anos de experiência no mercado. Nossa missão é transformar organizações através de soluções estratégicas personalizadas, capacitando pessoas e processos para alcançar resultados excepcionais.

Atuamos com metodologias comprovadas e uma equipe de consultores experientes, oferecendo diagnóstico preciso, planejamento estratégico e execução orientada a resultados. Nossos serviços abrangem consultoria empresarial, mentoria executiva, treinamentos corporativos e assessments de liderança.`

export const DEFAULT_CONDICOES_GERAIS = `1. Esta proposta tem validade de 30 dias a partir da data de emissão.
2. Os valores apresentados são válidos exclusivamente para o escopo descrito neste documento.
3. Eventuais alterações de escopo serão previamente acordadas entre as partes e podem implicar em reajuste de valores.
4. O cronograma de execução será definido em comum acordo após a aprovação desta proposta.
5. Os pagamentos deverão ser efetuados conforme as condições estabelecidas no campo "Condições de Pagamento".
6. A Trend Consultoria compromete-se a manter sigilo absoluto sobre todas as informações acessadas durante a prestação dos serviços.
7. Em caso de cancelamento após o início dos serviços, será cobrado o valor proporcional às atividades já realizadas.`

export const DEFAULT_PERFIL_INSTRUTOR = `Flávio Moura - Consultor Empresarial e Mentor de Negócios

Com mais de 15 anos de experiência em consultoria empresarial, Flávio Moura é especialista em gestão estratégica, desenvolvimento de lideranças e transformação organizacional. Possui ampla atuação no segmento corporativo, conduzindo projetos de consultoria, mentoria e treinamentos para empresas de diversos portes e segmentos.

Formação acadêmica em Administração de Empresas, com especializações em Gestão Estratégica e Desenvolvimento de Líderes. Atua como consultor e mentor de diversas empresas, ajudando na estruturação de processos, planejamento estratégico e desenvolvimento de equipes de alta performance.`

export const DEFAULT_SERVICOS_OFERECIDOS = `A Trend Consultoria oferece soluções personalizadas em:
• Consultoria Empresarial Estratégica
• Mentoria Executiva e de Negócios
• Treinamentos Corporativos In Company
• Assessment e Mapeamento de Competências
• Facilitação de Encontros Estratégicos
• Desenvolvimento de Lideranças`

export interface CondicaoComercialItem {
  id: string
  valor_modulo: string
  valor_global: string
  valor_creditado: string
  valor_liquido: string
  prazo_pagamento: string
}

export interface ProposalFormData {
  cliente_id: string
  nome_contato: string
  nome_evento: string
  objetivo: string
  publico_alvo: string
  cronograma: string
  local: string
  formato: string
  estrutura_programa: string
  valor_modulo_4h: string
  valor_modulo_8h: string
  valor_global: string
  condicoes_pagamento: string
  validade_proposta: string
  data_geracao: string
  texto_institucional: string
  condicoes_gerais: string
  perfil_instrutor: string
  status: string
  description: string
  condicoes_comerciais: CondicaoComercialItem[]
}

export function createEmptyCondicao(defaultIvaPercent: number = 0): CondicaoComercialItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    valor_modulo: '',
    valor_global: '',
    valor_creditado: '0.00',
    valor_liquido: '0.00',
    prazo_pagamento: '',
  }
}

export function getDefaultFormData(defaultIvaPercent: number = 0): ProposalFormData {
  return {
    cliente_id: '',
    nome_contato: '',
    nome_evento: '',
    objetivo: '',
    publico_alvo: '',
    cronograma: '',
    local: '',
    formato: '',
    estrutura_programa: '',
    valor_modulo_4h: '',
    valor_modulo_8h: '',
    valor_global: '',
    condicoes_pagamento: '',
    validade_proposta: '30 dias',
    data_geracao: format(new Date(), 'yyyy-MM-dd'),
    texto_institucional: DEFAULT_TEXTO_INSTITUCIONAL,
    condicoes_gerais: DEFAULT_CONDICOES_GERAIS,
    perfil_instrutor: DEFAULT_PERFIL_INSTRUTOR,
    status: 'em análise',
    description: DEFAULT_SERVICOS_OFERECIDOS,
    condicoes_comerciais: [createEmptyCondicao(defaultIvaPercent)],
  }
}

export function proposalToFormData(p: any, defaultIvaPercent: number = 0): ProposalFormData {
  let condicoes: CondicaoComercialItem[] = []
  if (Array.isArray(p.condicoes_comerciais) && p.condicoes_comerciais.length > 0) {
    condicoes = p.condicoes_comerciais.map((item: any) => {
      const global = parseFloat(item.valor_global) || 0
      const creditado =
        item.valor_creditado !== undefined && item.valor_creditado !== null
          ? parseFloat(item.valor_creditado) || 0
          : (global * defaultIvaPercent) / 100
      const liquido =
        item.valor_liquido !== undefined && item.valor_liquido !== null
          ? parseFloat(item.valor_liquido) || 0
          : global - creditado

      return {
        id: item.id || Math.random().toString(36).substring(2, 9),
        valor_modulo: item.valor_modulo?.toString() ?? '',
        valor_global: item.valor_global?.toString() ?? '',
        valor_creditado: creditado.toFixed(2),
        valor_liquido: liquido.toFixed(2),
        prazo_pagamento: item.prazo_pagamento || '',
      }
    })
  } else if (p.valor_global || p.valor_modulo_4h || p.valor_modulo_8h) {
    // Legacy fallback row
    const global = parseFloat(p.valor_global) || 0
    const modulo = parseFloat(p.valor_modulo_8h || p.valor_modulo_4h) || 0
    const creditado = (global * defaultIvaPercent) / 100
    const liquido = global - creditado
    condicoes = [
      {
        id: Math.random().toString(36).substring(2, 9),
        valor_modulo: modulo ? modulo.toString() : '',
        valor_global: global ? global.toString() : '',
        valor_creditado: creditado.toFixed(2),
        valor_liquido: liquido.toFixed(2),
        prazo_pagamento: p.condicoes_pagamento || '',
      },
    ]
  } else {
    condicoes = [createEmptyCondicao(defaultIvaPercent)]
  }

  // Calculate valor_global to show first condition's value or 0
  const firstGlobal =
    condicoes.length > 0 && condicoes[0].valor_global
      ? condicoes[0].valor_global
      : p.valor_global?.toString() || ''

  return {
    cliente_id: p.cliente_id || '',
    nome_contato: p.nome_contato || '',
    nome_evento: p.nome_evento || p.title || '',
    objetivo: p.objetivo || '',
    publico_alvo: p.publico_alvo || '',
    cronograma: p.cronograma || '',
    local: p.local || '',
    formato: p.formato || '',
    estrutura_programa: p.estrutura_programa || '',
    valor_modulo_4h: p.valor_modulo_4h?.toString() || '',
    valor_modulo_8h: p.valor_modulo_8h?.toString() || '',
    valor_global: firstGlobal,
    condicoes_pagamento: p.condicoes_pagamento || '',
    validade_proposta: p.validade_proposta || '',
    data_geracao: p.data_geracao ? p.data_geracao.split(' ')[0] : format(new Date(), 'yyyy-MM-dd'),
    texto_institucional: p.texto_institucional || DEFAULT_TEXTO_INSTITUCIONAL,
    condicoes_gerais: p.condicoes_gerais || DEFAULT_CONDICOES_GERAIS,
    perfil_instrutor: p.perfil_instrutor || DEFAULT_PERFIL_INSTRUTOR,
    status: p.status || 'em análise',
    description: p.description || DEFAULT_SERVICOS_OFERECIDOS,
    condicoes_comerciais: condicoes,
  }
}

export function formDataToPayload(data: ProposalFormData): Record<string, any> {
  const parsedCondicoes = (data.condicoes_comerciais || []).map((c) => ({
    id: c.id,
    valor_modulo: parseFloat(c.valor_modulo) || 0,
    valor_global: parseFloat(c.valor_global) || 0,
    valor_creditado: parseFloat(c.valor_creditado) || 0,
    valor_liquido: parseFloat(c.valor_liquido) || 0,
    prazo_pagamento: c.prazo_pagamento,
  }))

  const mainGlobal =
    parsedCondicoes.length > 0
      ? parsedCondicoes[0].valor_global
      : parseFloat(data.valor_global) || 0
  const mainModulo =
    parsedCondicoes.length > 0
      ? parsedCondicoes[0].valor_modulo
      : parseFloat(data.valor_modulo_8h) || 0

  return {
    cliente_id: data.cliente_id || null,
    nome_contato: data.nome_contato,
    nome_evento: data.nome_evento,
    objetivo: data.objetivo,
    publico_alvo: data.publico_alvo,
    cronograma: data.cronograma,
    local: data.local,
    formato: data.formato,
    estrutura_programa: data.estrutura_programa,
    valor_modulo_4h: parseFloat(data.valor_modulo_4h) || 0,
    valor_modulo_8h: mainModulo,
    valor_global: mainGlobal,
    condicoes_pagamento: data.condicoes_pagamento,
    validade_proposta: data.validade_proposta,
    data_geracao: data.data_geracao,
    texto_institucional: data.texto_institucional,
    condicoes_gerais: data.condicoes_gerais,
    perfil_instrutor: data.perfil_instrutor,
    status: data.status,
    description: data.description,
    title: data.nome_evento,
    value: mainGlobal,
    expirationDate: data.data_geracao,
    condicoes_comerciais: parsedCondicoes,
  }
}
