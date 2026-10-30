import React from 'react'
import { MentorAdvisorChat } from '@/components/mentorados/MentorAdvisorChat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Sparkles, Target, Compass, Award } from 'lucide-react'

export default function PortalAdvisorPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Assistente Exclusivo do Mentorado
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Acompanhamento Inteligente de Mentoria
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Converse com o agente nativo treinado na metodologia do Grupo Flávio Moura para resumir
            sua evolução, monitorar desvios de metas e montar a pauta da sua próxima sessão.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat Principal com o Agente */}
        <div className="lg:col-span-8">
          <MentorAdvisorChat />
        </div>

        {/* Informações de Apoio ao Mentorado */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Como a IA te apoia?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <p>
                <strong>1. Resumo de Evolução:</strong> Lê automaticamente o registro das suas
                sessões anteriores e resume os marcos alcançados.
              </p>
              <p>
                <strong>2. Alerta de Desvios:</strong> Sinaliza tarefas, decisões e metas com prazo
                em aberto antes da próxima mentoria.
              </p>
              <p>
                <strong>3. Pauta Estruturada:</strong> Prepara sugestões de temas prioritários para
                você aproveitar cada minuto com o mentor.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" /> Dicas de Produtividade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                • Realize uma checagem com o agente <strong>24h a 48h antes</strong> de cada sessão
                agendada.
              </p>
              <p>
                • Anote os tópicos sugeridos para apresentar seus números e gargalos com clareza.
              </p>
              <p>
                • Revise os planos de ação combinados para manter a consistência da sua empresa.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">Metodologia Flávio Moura</p>
                <p className="text-muted-foreground">
                  Alta performance e gestão estratégica para o seu negócio.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
