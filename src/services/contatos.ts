import pb from '@/lib/pocketbase/client'

export interface Contato {
  id: string
  nome: string
  empresa: string
  email: string
  whatsapp: string
  data_captura: string
  created: string
  updated: string
}

export type ContatoInput = Omit<Contato, 'id' | 'created' | 'updated'>

export const getContatos = () =>
  pb.collection('v1_contatos').getFullList<Contato>({ sort: '-data_captura' })

export const createContato = (data: Partial<ContatoInput>) =>
  pb.collection('v1_contatos').create(data)

export const updateContato = (id: string, data: Partial<ContatoInput>) =>
  pb.collection('v1_contatos').update(id, data)

export const deleteContato = (id: string) => pb.collection('v1_contatos').delete(id)
