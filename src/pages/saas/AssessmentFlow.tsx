import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useParams } from 'react-router-dom'

export default function ClientAssessmentFlow() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Assessment</h1>
      <Card>
        <CardHeader>
          <CardTitle>Responder Assessment {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
