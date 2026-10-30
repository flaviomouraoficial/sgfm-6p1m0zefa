import pb from '@/lib/pocketbase/client'
import {
  MeetingFormData,
  RecommendationTier,
  determineTier,
  getProductDetails,
  computePains,
  computeObjections,
} from '@/lib/assistente-comercial-data'

export interface ReuniaoComercialRecord {
  id: string
  lead_nome: string
  empresa: string
  segmento?: string
  colaboradores?: number
  tempo_empresa?: string
  canal_origem?: string
  linha_interesse?: string
  participantes?: string
  decisor_presente?: string

  faturamento?: string
  urgencia?: string
  historico_consultoria?: string
  capacidade_investimento?: string
  prontidao_emocional?: string

  dor_principal?: string
  sono_futuro?: string
  horas_operacao?: string
  sair_15_dias?: string
  saida_gestor?: string
  custo_rotatividade?: string
  cenario_12_meses?: string

  produto_recomendado?: string
  valor_recomendado?: number
  racional_motor?: string
  dores_detectadas?: any
  objecoes_sugeridas?: any

  compromissos?: string
  numeros_citados?: string
  termos_cliente?: string
  indicacoes?: string
  proximo_passo?: string
  data_proximo_contato?: string

  resultado?: string
  condicao_escolhida?: string
  forma_pagamento?: string
  resumo_texto?: string
  deal_id?: string

  created: string
  updated: string
  expand?: {
    deal_id?: any
  }
}

export function mapResultToDealStage(
  resultado: string,
): 'lead' | 'contact' | 'proposal' | 'won' | 'lost' {
  switch (resultado) {
    case 'Fechou':
      return 'won'
    case 'Não qualificado':
      return 'lost'
    case 'Vai pensar':
    case 'Objeção em aberto':
      return 'proposal'
    case 'Downsell aplicado':
      return 'proposal'
    case 'Reagendado':
      return 'contact'
    default:
      return 'lead'
  }
}

export async function listReunioesComerciais(limit = 50): Promise<ReuniaoComercialRecord[]> {
  try {
    const records = await pb
      .collection('v1_reunioes_comerciais')
      .getList<ReuniaoComercialRecord>(1, limit, {
        sort: '-created',
        expand: 'deal_id',
      })
    return records.items
  } catch (err) {
    console.error('Erro ao listar reuniões comerciais:', err)
    return []
  }
}

export async function saveReuniaoComercial(
  formData: MeetingFormData,
  resumoTexto: string,
  existingId?: string,
): Promise<{ reuniao: ReuniaoComercialRecord; dealId?: string }> {
  const tier: RecommendationTier = determineTier(formData)
  const { productName, price } = getProductDetails(tier)
  const pains = computePains(tier, formData)
  const objs = computeObjections(formData)

  // 1. Sincronizar/criar deal no Funil de Vendas (v1_deals) se tiver lead_nome
  let dealId: string | undefined

  if (formData.leadName) {
    try {
      const stage = mapResultToDealStage(formData.resultado)
      const dealTitle = `${formData.company ? `${formData.company} — ` : ''}${productName}`
      const dealNotes = [
        `Reunião Assistente Comercial realizada em ${new Date().toLocaleDateString('pt-BR')}`,
        `Resultado: ${formData.resultado || 'Em andamento'}`,
        formData.condicaoEscolhida ? `Condição: ${formData.condicaoEscolhida}` : null,
        formData.proximoPasso ? `Próximo Passo: ${formData.proximoPasso}` : null,
        formData.dataProximoContato ? `Data Próximo Contato: ${formData.dataProximoContato}` : null,
        formData.dorPrincipal ? `Principal Dor: ${formData.dorPrincipal}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      // Verificar se já existe um negócio para este cliente/empresa
      const sanitizedCompany = formData.company?.replace(/['"\\]/g, '').trim()
      const sanitizedLead = formData.leadName?.replace(/['"\\]/g, '').trim()

      let existingDeals: any[] = []
      if (sanitizedCompany) {
        try {
          existingDeals = await pb.collection('v1_deals').getFullList({
            filter: `clientName ~ "${sanitizedCompany}" || title ~ "${sanitizedCompany}"`,
            sort: '-created',
          })
        } catch {
          /* intentionally ignored */
        }
      }

      if (existingDeals.length === 0 && sanitizedLead) {
        try {
          existingDeals = await pb.collection('v1_deals').getFullList({
            filter: `clientName ~ "${sanitizedLead}"`,
            sort: '-created',
          })
        } catch {
          /* intentionally ignored */
        }
      }

      if (existingDeals.length > 0) {
        const targetDeal = existingDeals[0]
        const updated = await pb.collection('v1_deals').update(targetDeal.id, {
          title: dealTitle,
          clientName: formData.company || formData.leadName,
          value: price,
          stage,
          notes: `${targetDeal.notes ? `${targetDeal.notes}\n\n---\n` : ''}${dealNotes}`,
        })
        dealId = updated.id
      } else {
        const created = await pb.collection('v1_deals').create({
          title: dealTitle,
          clientName: formData.company || formData.leadName,
          value: price,
          stage,
          notes: dealNotes,
        })
        dealId = created.id
      }
    } catch (dealErr) {
      console.warn('Não foi possível sincronizar com o funil:', dealErr)
    }
  }

  // 2. Gravar o registro na collection v1_reunioes_comerciais
  const payload: Partial<ReuniaoComercialRecord> = {
    lead_nome: formData.leadName,
    empresa: formData.company,
    segmento: formData.segment,
    colaboradores: formData.employees ? Number(formData.employees) : undefined,
    tempo_empresa: formData.tenure,
    canal_origem: formData.channel,
    linha_interesse: formData.interest,
    participantes: formData.participants,
    decisor_presente: formData.decisor,

    faturamento: formData.revenue,
    urgencia: formData.urgency,
    historico_consultoria: formData.history,
    capacidade_investimento: formData.liquidity,
    prontidao_emocional: formData.readiness,

    dor_principal: formData.dorPrincipal,
    sono_futuro: formData.sonoFuturo,
    horas_operacao: formData.horasOperacao,
    sair_15_dias: formData.sair15Dias,
    saida_gestor: formData.saidaGestor,
    custo_rotatividade: formData.custoRotatividade,
    cenario_12_meses: formData.cenario12Meses,

    produto_recomendado: productName,
    valor_recomendado: price,
    racional_motor: tier.reason,
    dores_detectadas: pains,
    objecoes_sugeridas: objs,

    compromissos: formData.compromissos,
    numeros_citados: formData.numerosCitados,
    termos_cliente: formData.termosCliente,
    indicacoes: formData.indicacoes,
    proximo_passo: formData.proximoPasso,
    data_proximo_contato: formData.dataProximoContato,

    resultado: formData.resultado,
    condicao_escolhida: formData.condicaoEscolhida,
    forma_pagamento: formData.formaPagamento,
    resumo_texto: resumoTexto,
    deal_id: dealId,
  }

  let reuniaoRecord: ReuniaoComercialRecord
  if (existingId) {
    reuniaoRecord = await pb
      .collection('v1_reunioes_comerciais')
      .update<ReuniaoComercialRecord>(existingId, payload)
  } else {
    reuniaoRecord = await pb
      .collection('v1_reunioes_comerciais')
      .create<ReuniaoComercialRecord>(payload)
  }

  return { reuniao: reuniaoRecord, dealId }
}
