import { useState } from 'react'
import { useMainStore } from '@/stores/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { MessageTemplates } from '@/lib/types'
import { Save } from 'lucide-react'

const VARIABLES = [
  { label: 'Nome', value: '{{nome_mentorado}}' },
  { label: 'Data', value: '{{data_sessao}}' },
  { label: 'Horário', value: '{{horario_sessao}}' },
  { label: 'Link Reunião', value: '{{link_reuniao}}' },
]

export function TemplatesManager() {
  const { messageTemplates, setMessageTemplates } = useMainStore()
  const [templates, setTemplates] = useState<MessageTemplates>(messageTemplates)

  const handleSave = () => {
    setMessageTemplates(templates)
    toast({
      title: 'Templates Salvos',
      description: 'Os modelos de mensagem foram atualizados com sucesso.',
    })
  }

  const insertVar = (field: keyof MessageTemplates, val: string) => {
    setTemplates((prev) => ({ ...prev, [field]: prev[field] + val }))
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border/50">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-base">Link de Reunião Padrão</CardTitle>
          <CardDescription className="text-xs">
            Este link será usado automaticamente sempre que a variável {'{{link_reuniao}}'} for
            inserida.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Input
            value={templates.defaultMeetingLink}
            onChange={(e) => setTemplates({ ...templates, defaultMeetingLink: e.target.value })}
            placeholder="Ex: https://meet.google.com/..."
          />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base">E-mail de Lembrete</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Assunto do E-mail</Label>
              <Input
                value={templates.emailSubject}
                onChange={(e) => setTemplates({ ...templates, emailSubject: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {VARIABLES.map((v) => (
                  <Button
                    key={v.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => insertVar('emailSubject', v.value)}
                  >
                    + {v.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-xs">Corpo do E-mail</Label>
              <Textarea
                className="min-h-[160px] text-sm leading-relaxed"
                value={templates.emailBody}
                onChange={(e) => setTemplates({ ...templates, emailBody: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {VARIABLES.map((v) => (
                  <Button
                    key={v.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => insertVar('emailBody', v.value)}
                  >
                    + {v.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-base">Mensagem de WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Corpo da Mensagem</Label>
              <Textarea
                className="min-h-[160px] text-sm leading-relaxed"
                value={templates.whatsappBody}
                onChange={(e) => setTemplates({ ...templates, whatsappBody: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {VARIABLES.map((v) => (
                  <Button
                    key={v.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => insertVar('whatsappBody', v.value)}
                  >
                    + {v.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} className="w-full sm:w-auto shadow-sm">
          <Save className="w-4 h-4 mr-2" /> Salvar Templates
        </Button>
      </div>
    </div>
  )
}
