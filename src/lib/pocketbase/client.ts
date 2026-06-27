import PocketBase from 'pocketbase'
import { toast } from '@/hooks/use-toast'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

pb.afterSend = function (response, data) {
  if (response.status >= 400 && response.status < 600) {
    let message = data?.message || 'Ocorreu um erro na requisição.'

    if (data?.data && typeof data.data === 'object') {
      const fields = Object.values(data.data)
        .map((err: any) => err?.message)
        .filter(Boolean)
      if (fields.length > 0) {
        message = fields.join(' | ')
      }
    }

    if (response.status === 403) {
      message = 'Acesso negado. Você não tem permissão para realizar esta ação.'
    } else if (response.status === 404) {
      message = 'Recurso não encontrado ou já excluído.'
    } else if (response.status === 400 && !data?.data) {
      message = 'Dados inválidos fornecidos.'
    }

    toast({
      title: `Erro ${response.status}`,
      description: message,
      variant: 'destructive',
    })
  }
  return data
}

export default pb
