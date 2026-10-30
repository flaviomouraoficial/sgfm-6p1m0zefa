import pb from '@/lib/pocketbase/client'
import { RepresentanteLegal } from '@/lib/types'

export const representantesService = {
  async listByEmpresa(empresaId: string): Promise<RepresentanteLegal[]> {
    if (!empresaId) return []
    return pb.collection('v1_representantes_legais').getFullList<RepresentanteLegal>({
      filter: `empresa_id = "${empresaId}"`,
      sort: '-is_principal,-ativo,nome_completo',
    })
  },

  async listByCliente(clienteId: string): Promise<RepresentanteLegal[]> {
    if (!clienteId) return []
    return pb.collection('v1_representantes_legais').getFullList<RepresentanteLegal>({
      filter: `cliente_id = "${clienteId}"`,
      sort: '-is_principal,-ativo,nome_completo',
    })
  },

  async getPrincipalByEmpresa(empresaId: string): Promise<RepresentanteLegal | null> {
    if (!empresaId) return null
    try {
      const records = await pb
        .collection('v1_representantes_legais')
        .getList<RepresentanteLegal>(1, 1, {
          filter: `empresa_id = "${empresaId}" && is_principal = true && ativo = true`,
        })
      if (records.items.length > 0) return records.items[0]
      // fallback to any active
      const fallback = await pb
        .collection('v1_representantes_legais')
        .getList<RepresentanteLegal>(1, 1, {
          filter: `empresa_id = "${empresaId}" && ativo = true`,
          sort: '-created',
        })
      return fallback.items[0] || null
    } catch {
      return null
    }
  },

  async getPrincipalByCliente(clienteId: string): Promise<RepresentanteLegal | null> {
    if (!clienteId) return null
    try {
      const records = await pb
        .collection('v1_representantes_legais')
        .getList<RepresentanteLegal>(1, 1, {
          filter: `cliente_id = "${clienteId}" && is_principal = true && ativo = true`,
        })
      if (records.items.length > 0) return records.items[0]
      const fallback = await pb
        .collection('v1_representantes_legais')
        .getList<RepresentanteLegal>(1, 1, {
          filter: `cliente_id = "${clienteId}" && ativo = true`,
          sort: '-created',
        })
      return fallback.items[0] || null
    } catch {
      return null
    }
  },

  async create(data: Partial<RepresentanteLegal>): Promise<RepresentanteLegal> {
    // Se for marcado como principal, desmarcar outros da mesma empresa/cliente
    if (data.is_principal) {
      await this.clearOtherPrincipals(data.empresa_id, data.cliente_id)
    }
    return pb.collection('v1_representantes_legais').create<RepresentanteLegal>({
      ...data,
      ativo: data.ativo !== false,
    })
  },

  /**
   * Regra de integridade histórica: representante NUNCA é excluído nem tem dados sobrescritos.
   * Ao mudar o representante de uma empresa/cliente, o anterior é INATIVADO e um novo é criado,
   * preservando a integridade histórica dos contratos já emitidos.
   */
  async replaceWithNew(
    oldId: string,
    newData: Partial<RepresentanteLegal>,
  ): Promise<RepresentanteLegal> {
    // 1. Inativar o antigo e remover marcação de principal
    await pb.collection('v1_representantes_legais').update(oldId, {
      ativo: false,
      is_principal: false,
      observacoes: `Inativado e substituído em ${new Date().toLocaleDateString('pt-BR')}`,
    })

    // 2. Limpar outros principais se o novo for principal
    if (newData.is_principal) {
      await this.clearOtherPrincipals(newData.empresa_id, newData.cliente_id)
    }

    // 3. Criar o novo registro
    return pb.collection('v1_representantes_legais').create<RepresentanteLegal>({
      ...newData,
      ativo: true,
      is_principal: newData.is_principal !== false,
    })
  },

  async inativar(id: string): Promise<RepresentanteLegal> {
    return pb.collection('v1_representantes_legais').update<RepresentanteLegal>(id, {
      ativo: false,
      is_principal: false,
    })
  },

  async ativar(id: string): Promise<RepresentanteLegal> {
    return pb.collection('v1_representantes_legais').update<RepresentanteLegal>(id, {
      ativo: true,
    })
  },

  async setPrincipal(rep: RepresentanteLegal): Promise<RepresentanteLegal> {
    await this.clearOtherPrincipals(rep.empresa_id, rep.cliente_id)
    return pb.collection('v1_representantes_legais').update<RepresentanteLegal>(rep.id, {
      is_principal: true,
      ativo: true,
    })
  },

  async clearOtherPrincipals(empresaId?: string, clienteId?: string) {
    let filter = ''
    if (empresaId) filter = `empresa_id = "${empresaId}" && is_principal = true`
    else if (clienteId) filter = `cliente_id = "${clienteId}" && is_principal = true`
    else return

    try {
      const existing = await pb
        .collection('v1_representantes_legais')
        .getFullList<RepresentanteLegal>({
          filter,
        })
      for (const item of existing) {
        await pb.collection('v1_representantes_legais').update(item.id, { is_principal: false })
      }
    } catch (err) {
      console.error('Erro ao limpar outros principais:', err)
    }
  },
}
