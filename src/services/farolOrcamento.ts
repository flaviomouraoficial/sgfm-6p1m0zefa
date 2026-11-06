// ============================================================
// Serviço de dados do Farol Comercial (peças 3 e 4).
// CRUD das coleções de custo/alçadas/orçamentos criadas pela
// migração 0098 — nenhuma mudança de schema aqui.
// ============================================================
import pb from '@/lib/pocketbase/client'
import type {
  RecursoCusto,
  ComponenteCusto,
  OverheadConfig,
  AlcadaDesconto,
  ModeloCobranca,
  EscopoModulo,
} from '@/lib/orcamento'
import { OVERHEAD_DEFAULT } from '@/lib/orcamento'

const FAROL_EMAILS =
  "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || @request.auth.email = 'admin@grupoflaviomoura.com.br'"

export interface PerfisAcesso {
  id: string
  /** v1_access_profiles usa o campo "name" */
  name: string
}

export interface ClienteResumo {
  id: string
  name: string
}

export interface OrcamentoRegistro {
  id: string
  titulo: string
  cliente_id: string
  empresa_id: string
  modelo_id: string
  status: string
  versao_aprovada_id: string
  created: string
  updated: string
}

export interface VersaoRegistro {
  id: string
  orcamento_id: string
  versao: number
  dados_json: any
  custo_total: number
  preco_minimo: number
  preco_sugerido: number
  preco_final: number
  desconto_pct: number
  margem_alvo: number
  margem_real_pct: number
  margem_variacao: number
  autor_id: string
  autor_nome: string
  status: string
  observacoes: string
  created: string
  updated: string
}

export interface AprovacaoInterna {
  precisa: boolean
  aprovador_email: string
  aprovador_nome: string
  motivo: string
  desconto_pct: number
  data: string
  versao_id: string
}

export interface OrcamentoSalvoPayload {
  orcamentoId?: string
  titulo: string
  cliente_id: string
  empresa_id: string
  modelo_id: string
  escopo: {
    modelo_nome: string
    desconto_pct: number
    config: {
      pct_imposto: number
      fator_seguranca: number
      margem_alvo_pct: number
    }
    linhas: any[]
    observacoes?: string
    aprovacao?: AprovacaoInterna | null
  }
  totals: {
    custo_total: number
    preco_minimo: number
    preco_sugerido: number
    preco_final: number
    desconto_pct: number
    margem_alvo: number
    margem_real_pct: number
  }
  autor: { id: string; nome: string }
}

// ------------------------------------------------------------
// Recursos de custo
// ------------------------------------------------------------
const recursosService = {
  async list(): Promise<RecursoCusto[]> {
    try {
      return await pb.collection('v1_recursos_custo').getFullList<RecursoCusto>({
        sort: 'profissional_nome',
      })
    } catch {
      return []
    }
  },
  async create(data: Partial<RecursoCusto>): Promise<RecursoCusto> {
    return await pb.collection('v1_recursos_custo').create<RecursoCusto>({
      ...data,
      ativo: data.ativo ?? true,
    })
  },
  async update(id: string, data: Partial<RecursoCusto>): Promise<RecursoCusto> {
    return await pb.collection('v1_recursos_custo').update<RecursoCusto>(id, data)
  },
  async remove(id: string): Promise<void> {
    await pb.collection('v1_recursos_custo').delete(id)
  },
}

// ------------------------------------------------------------
// Componentes de custo
// ------------------------------------------------------------
const componentesService = {
  async list(): Promise<ComponenteCusto[]> {
    try {
      return await pb.collection('v1_componentes_custo').getFullList<ComponenteCusto>({
        sort: 'nome',
      })
    } catch {
      return []
    }
  },
  async create(data: Partial<ComponenteCusto>): Promise<ComponenteCusto> {
    return await pb.collection('v1_componentes_custo').create<ComponenteCusto>({
      ...data,
      ativo: data.ativo ?? true,
    })
  },
  async update(id: string, data: Partial<ComponenteCusto>): Promise<ComponenteCusto> {
    return await pb.collection('v1_componentes_custo').update<ComponenteCusto>(id, data)
  },
  async remove(id: string): Promise<void> {
    await pb.collection('v1_componentes_custo').delete(id)
  },
}

// ------------------------------------------------------------
// Overhead/imposto por empresa
// ------------------------------------------------------------
const overheadService = {
  async list(): Promise<OverheadConfig[]> {
    try {
      return await pb.collection('v1_overhead_config').getFullList<OverheadConfig>({
        sort: '-created',
      })
    } catch {
      return []
    }
  },
  async findForEmpresa(empresaId: string | null): Promise<OverheadConfig | null> {
    const all = await overheadService.list()
    const found = all.find((o) => (o.empresa_id || '') === (empresaId || ''))
    if (found) return found
    // Sem registro para esta empresa → devolve defaults aprovados (10/8/7 · 8% · 2,0×).
    return { ...OVERHEAD_DEFAULT, empresa_id: empresaId || undefined }
  },
  async save(empresaId: string | null, cfg: OverheadConfig): Promise<OverheadConfig> {
    const all = await overheadService.list()
    const found = all.find((o) => (o.empresa_id || '') === (empresaId || ''))
    const payload = {
      empresa_id: empresaId || '',
      pct_administrativo: cfg.pct_administrativo,
      pct_financeiro: cfg.pct_financeiro,
      pct_comercial: cfg.pct_comercial,
      pct_imposto: cfg.pct_imposto,
      fator_preparacao: cfg.fator_preparacao,
    }
    if (found && found.id)
      return await pb.collection('v1_overhead_config').update(found.id, payload)
    return await pb.collection('v1_overhead_config').create<OverheadConfig>(payload)
  },
}

// ------------------------------------------------------------
// Alçadas de desconto (perfil × % máximo)
// ------------------------------------------------------------
const alcadasService = {
  async list(): Promise<AlcadaDesconto[]> {
    try {
      return await pb.collection('v1_alcadas_desconto').getFullList<AlcadaDesconto>({
        sort: 'perfil_nome',
      })
    } catch {
      return []
    }
  },
  /** Na primeira abertura: semeia alçadas para os perfis de acesso existentes. */
  async seedFromPerfis(): Promise<boolean> {
    const [existentes, perfis] = await Promise.all([
      alcadasService.list(),
      pb.collection('v1_access_profiles').getFullList<PerfisAcesso>({ sort: 'name' }),
    ])
    const comNome = perfis.filter((p) => p.name)
    let criou = false
    for (const perfil of comNome) {
      const jaTem = existentes.some(
        (a) =>
          (a.perfil_id && a.perfil_id === perfil.id) ||
          (a.perfil_nome || '').toLowerCase() === (perfil.name || '').toLowerCase(),
      )
      if (jaTem) continue
      await pb.collection('v1_alcadas_desconto').create({
        perfil_id: perfil.id,
        perfil_nome: perfil.name,
        pct_max: 0,
      })
      criou = true
    }
    return criou
  },
  async save(perfilId: string, perfilNome: string, pctMax: number): Promise<void> {
    const existentes = await alcadasService.list()
    const achada = existentes.find(
      (a) =>
        a.perfil_id === perfilId ||
        (a.perfil_nome || '').toLowerCase() === perfilNome.toLowerCase(),
    )
    if (achada && achada.id) {
      await pb.collection('v1_alcadas_desconto').update(achada.id, { pct_max: pctMax })
      return
    }
    await pb.collection('v1_alcadas_desconto').create({
      perfil_id: perfilId,
      perfil_nome: perfilNome,
      pct_max: pctMax,
    })
  },
}

// ------------------------------------------------------------
// Modelos de cobrança (ativar/desativar — nunca deletar)
// ------------------------------------------------------------
const modelosService = {
  async list(): Promise<ModeloCobranca[]> {
    try {
      return await pb.collection('v1_modelos_cobranca').getFullList<ModeloCobranca>({
        sort: 'nome',
      })
    } catch {
      return []
    }
  },
  async setActive(id: string, ativo: boolean): Promise<void> {
    await pb.collection('v1_modelos_cobranca').update(id, { ativo })
  },
}

// ------------------------------------------------------------
// Módulos de escopo (catálogo semeados pela migração 0098)
// ------------------------------------------------------------
const escoposService = {
  async list(): Promise<EscopoModulo[]> {
    try {
      return await pb.collection('v1_escopo_modulos').getFullList<EscopoModulo>({ sort: 'nome' })
    } catch {
      return []
    }
  },
}

// ------------------------------------------------------------
// Clientes e perfis (para selects)
// ------------------------------------------------------------
const apoiosService = {
  async clientes(): Promise<ClienteResumo[]> {
    try {
      return await pb
        .collection('v1_clientes')
        .getFullList<ClienteResumo>({ sort: 'name', filter: 'status != "archived"' } as any)
    } catch {
      return []
    }
  },
  async perfis(): Promise<PerfisAcesso[]> {
    try {
      return await pb.collection('v1_access_profiles').getFullList<PerfisAcesso>({ sort: 'name' })
    } catch {
      return []
    }
  },
}

// ------------------------------------------------------------
// Orçamentos + versões
// ------------------------------------------------------------
const orcamentosService = {
  async list(): Promise<OrcamentoRegistro[]> {
    try {
      return await pb
        .collection('v1_orcamentos')
        .getFullList<OrcamentoRegistro>({ sort: '-created' })
    } catch {
      return []
    }
  },
  async get(id: string): Promise<OrcamentoRegistro | null> {
    try {
      return await pb.collection('v1_orcamentos').getOne<OrcamentoRegistro>(id)
    } catch {
      return null
    }
  },
  async versoes(orcamentoId: string): Promise<VersaoRegistro[]> {
    try {
      return await pb
        .collection('v1_orcamento_versoes')
        .getFullList<VersaoRegistro>({
          filter: `orcamento_id = "${orcamentoId}"`,
          sort: '-versao',
        } as any)
    } catch {
      return []
    }
  },
  /**
   * Salva uma versão nova: cria o orçamento se preciso, grava a versão com
   * data/autor/totais/variação de margem e (quando houve aprovação externa)
   * guarda quem autorizou dentro de escopo_json.aprovacao.
   */
  async salvarVersao(payload: OrcamentoSalvoPayload): Promise<{
    orcamento: OrcamentoRegistro
    versao: VersaoRegistro
  }> {
    let orcamentoId = payload.orcamentoId
    if (!orcamentoId) {
      const novo = await pb.collection('v1_orcamentos').create<OrcamentoRegistro>({
        titulo: payload.titulo,
        cliente_id: payload.cliente_id,
        empresa_id: payload.empresa_id,
        modelo_id: payload.modelo_id,
        escopo_json: {},
        status: 'rascunho',
      })
      orcamentoId = novo.id
    }
    const versoesAnteriores = await orcamentosService.versoes(orcamentoId)
    const ultima = versoesAnteriores[0]
    const novaVersao = ultima ? ultima.versao + 1 : 1
    const margemVariacao = ultima ? payload.totals.margem_real_pct - ultima.margem_real_pct : null

    const escopoJson = { ...payload.escopo } as any
    if (payload.escopo?.aprovacao) {
      // Regra da peça 4: v1_alcadas_desconto não tem campo autorizante —
      // quem autorizou fica registrado no próprio orçamento (aprovacao_interna).
      escopoJson.aprovacao_interna = {
        precisa: true,
        aprovador_email: payload.escopo.aprovacao.aprovador_email,
        aprovador_nome: payload.escopo.aprovacao.aprovador_nome,
        motivo: payload.escopo.aprovacao.motivo,
        desconto_pct: payload.escopo.aprovacao.desconto_pct,
        data: payload.escopo.aprovacao.data,
        versao: novaVersao,
      }
    }

    const versao = await pb.collection('v1_orcamento_versoes').create<VersaoRegistro>({
      orcamento_id: orcamentoId,
      versao: novaVersao,
      dados_json: escopoJson,
      custo_total: payload.totals.custo_total,
      preco_minimo: payload.totals.preco_minimo,
      preco_sugerido: payload.totals.preco_sugerido,
      preco_final: payload.totals.preco_final,
      desconto_pct: payload.totals.desconto_pct,
      margem_alvo: payload.totals.margem_alvo,
      margem_real_pct: payload.totals.margem_real_pct,
      margem_variacao: margemVariacao === null ? null : margemVariacao,
      autor_id: payload.autor.id,
      autor_nome: payload.autor.nome,
      status: 'rascunho',
      observacoes: payload.escopo.observacoes || '',
    })

    const orcamento = await pb.collection('v1_orcamentos').update<OrcamentoRegistro>(orcamentoId, {
      titulo: payload.titulo,
      cliente_id: payload.cliente_id,
      empresa_id: payload.empresa_id,
      modelo_id: payload.modelo_id,
      escopo_json: escopoJson,
      status: 'rascunho',
    })
    return { orcamento, versao }
  },
  /** Aprovar versão: marca a versão e grava versao_aprovada_id no orçamento. */
  async aprovarVersao(orcamentoId: string, versaoId: string): Promise<void> {
    await pb.collection('v1_orcamento_versoes').update(versaoId, { status: 'aprovada' })
    await pb.collection('v1_orcamentos').update(orcamentoId, { versao_aprovada_id: versaoId })
  },
}

export const farolService = {
  recursos: recursosService,
  componentes: componentesService,
  overhead: overheadService,
  alcadas: alcadasService,
  modelos: modelosService,
  escopos: escoposService,
  apoios: apoiosService,
  orcamentos: orcamentosService,
}

export { FAROL_EMAILS }
