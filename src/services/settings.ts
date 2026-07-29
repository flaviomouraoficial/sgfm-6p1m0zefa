import pb from '@/lib/pocketbase/client'

export interface SettingsServico {
  id: string
  nome: string
  descricao?: string
  ativo?: boolean
}

export interface SettingsCategoria {
  id: string
  nome: string
  tipo: 'Receita' | 'Despesa'
  cor?: string
}

export const settingsService = {
  async getServicos(): Promise<SettingsServico[]> {
    try {
      return await pb.collection('v1_settings_servicos').getFullList({ sort: 'nome' })
    } catch {
      return []
    }
  },
  async addServico(nome: string, descricao?: string): Promise<SettingsServico> {
    return await pb.collection('v1_settings_servicos').create({ nome, descricao, ativo: true })
  },
  async deleteServico(id: string): Promise<void> {
    await pb.collection('v1_settings_servicos').delete(id)
  },
  async getCategorias(tipo?: 'Receita' | 'Despesa'): Promise<SettingsCategoria[]> {
    try {
      const filter = tipo ? `tipo = "${tipo}"` : undefined
      return await pb.collection('v1_settings_categorias').getFullList({
        sort: 'nome',
        filter,
      } as any)
    } catch {
      return []
    }
  },
  async addCategoria(
    nome: string,
    tipo: 'Receita' | 'Despesa',
    cor?: string,
  ): Promise<SettingsCategoria> {
    return await pb.collection('v1_settings_categorias').create({ nome, tipo, cor })
  },
  async deleteCategoria(id: string): Promise<void> {
    await pb.collection('v1_settings_categorias').delete(id)
  },
  async migrateFromStore(): Promise<void> {
    try {
      const storeRecords = await pb.collection('settings_store').getFullList()
      if (storeRecords.length > 0) {
        const data = storeRecords[0].data || {}
        if (data.services && Array.isArray(data.services)) {
          for (const svc of data.services) {
            if (!svc || typeof svc !== 'string') continue
            try {
              await settingsService.addServico(svc)
            } catch {
              /* may already exist */
            }
          }
        }
        if (data.expenseCategories && Array.isArray(data.expenseCategories)) {
          for (const cat of data.expenseCategories) {
            if (!cat || typeof cat !== 'string') continue
            try {
              await settingsService.addCategoria(cat, 'Despesa')
            } catch {
              /* may already exist */
            }
          }
        }
      }
    } catch {
      /* settings_store may not have data yet */
    }
  },
}
