import PocketBase from 'pocketbase'
import { useRecentStore } from '@/stores/recent'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

pb.afterSend = function (response, data) {
  try {
    const url = response.url
    if (response.status === 200 && data && data.id) {
      const isGetOne = url.includes('/records/') && !url.includes('?')
      if (isGetOne) {
        if (url.includes('/v1_recibos/records/')) {
          useRecentStore.getState().addItem({
            id: data.id,
            title: `Recibo ${data.numero || ''}`,
            url: `/admin/recibos?id=${data.id}`,
            iconType: 'receipt',
          })
        } else if (url.includes('/v1_disc_respostas/records/')) {
          useRecentStore.getState().addItem({
            id: data.id,
            title: `DISC: ${data.nome || 'Relatório'}`,
            url: `/admin/disc/report/${data.id}`,
            iconType: 'disc',
          })
        } else if (url.includes('/v1_assessment_respostas/records/')) {
          useRecentStore.getState().addItem({
            id: data.id,
            title: `Sucessão: ${data.nome_respondente || 'Relatório'}`,
            url: `/admin/assessments/report/${data.id}`,
            iconType: 'assessment',
          })
        }
      }
    }
  } catch (err) {
    console.error('Error tracking recent item:', err)
  }
  return data
}

export default pb
