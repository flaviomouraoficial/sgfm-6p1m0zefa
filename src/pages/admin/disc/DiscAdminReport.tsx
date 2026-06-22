import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DiscReport } from '@/components/disc/DiscReport'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function DiscAdminReport() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const resp = await pb.collection('v1_disc_respostas').getOne(id!, {
          expand: 'link_id,link_id.empresa_id',
        })

        let logoUrl = null
        try {
          const settingsList = await pb.collection('v1_saas_settings').getFullList()
          const settings = settingsList.length > 0 ? settingsList[0] : null
          if (settings?.logo) {
            logoUrl = pb.files.getUrl(settings, settings.logo)
          }
        } catch {
          /* intentionally ignored */
        }

        setReportData({
          nome: resp.nome,
          empresa: resp.expand?.link_id?.expand?.empresa_id?.name || 'Organização Confidencial',
          logoUrl,
          scores: {
            D: resp.pontuacao_d,
            I: resp.pontuacao_i,
            S: resp.pontuacao_s,
            C: resp.pontuacao_c,
          },
          predominante: resp.perfil_predominante,
        })
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar relatório.')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

  if (loading)
    return <div className="p-8 text-center text-muted-foreground">Carregando relatório...</div>
  if (error) return <div className="p-8 text-center text-destructive font-medium">{error}</div>

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 print:hidden z-10">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
      {reportData && <DiscReport {...reportData} />}
    </div>
  )
}
