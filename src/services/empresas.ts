import pb from '@/lib/pocketbase/client'
import { Empresa } from '@/lib/types'

export const empresasService = {
  async list(): Promise<Empresa[]> {
    return await pb.collection('v1_empresas').getFullList<Empresa>({
      sort: '-is_principal,nome',
    })
  },

  async getById(id: string): Promise<Empresa> {
    return await pb.collection('v1_empresas').getOne<Empresa>(id)
  },

  async create(data: Partial<Empresa>): Promise<Empresa> {
    return await pb.collection('v1_empresas').create<Empresa>(data)
  },

  async update(id: string, data: Partial<Empresa>): Promise<Empresa> {
    return await pb.collection('v1_empresas').update<Empresa>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return await pb.collection('v1_empresas').delete(id)
  },
}
