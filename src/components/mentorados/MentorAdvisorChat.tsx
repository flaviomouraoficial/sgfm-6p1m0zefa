import React, { useState, useEffect, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Bot,
  User,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react'

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  created?: string
}

const QUICK_PROMPTS = [
  {
    label: 'Resumo de Evolução',
    icon: TrendingUp,
    prompt:
      'Analise minhas sessões de mentoria registradas e faça um resumo consolidado da minha evolução e marcos conquistados.',
  },
  {
    label: 'Alertar Desvios de Metas',
    icon: AlertTriangle,
    prompt:
      'Existem tarefas, prazos ou metas acordadas nas sessões anteriores com risco de desvio ou pendentes para a próxima mentoria?',
  },
  {
    label: 'Pauta Sugerida da Próxima Sessão',
    icon: FileText,
    prompt:
      'Com base no meu momento atual e nas anotações das sessões, sugira uma pauta estruturada de 3 a 5 tópicos para a próxima mentoria com Flávio Moura.',
  },
]

export function MentorAdvisorChat() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá, ${user?.name ? user.name.split(' ')[0] : 'mentorando'}! Sou seu **Mentor Advisor IA** do Grupo Flávio Moura.\n\nAcompanho sua trajetória e analiso suas sessões, tarefas e metas para garantir que você chegue na próxima mentoria com máxima clareza e alinhamento.\n\nComo posso te ajudar hoje? Você pode clicar em uma das ações rápidas abaixo ou me enviar uma pergunta direta.`,
    },
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isLoading) return

    const userMsgId = 'user-' + Date.now()
    const newMessages: MessageItem[] = [...messages, { id: userMsgId, role: 'user', content: text }]
    setMessages(newMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/mentor-advisor/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId,
          }),
        },
      )

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Não foi possível obter resposta do agente.')
      }

      if (payload.conversation_id) {
        setConversationId(payload.conversation_id)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: payload.message_id || 'ai-' + Date.now(),
          role: 'assistant',
          content: payload.content || 'Sem resposta do mentor.',
        },
      ])
    } catch (err: any) {
      console.error('Erro no chat com mentor advisor:', err)
      toast({
        title: 'Aviso da IA',
        description: err.message || 'Erro ao comunicar com o agente nativo.',
        variant: 'destructive',
      })
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: `Tive um problema ao processar sua consulta: ${err.message}. Por favor, tente novamente em instantes.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetChat = () => {
    setConversationId(null)
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `Conversa reiniciada. Em que posso te apoiar para a sua próxima sessão de mentoria?`,
      },
    ])
  }

  return (
    <Card className="border border-border/80 shadow-md flex flex-col h-[650px] overflow-hidden">
      <CardHeader className="bg-muted/30 border-b pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Mentor Advisor IA
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-[10px] font-semibold border-primary/20"
                >
                  Agente Nativo SGFM
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Acompanhamento inteligente de evolução, metas e pauta de mentoria
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
            onClick={handleResetChat}
            title="Iniciar nova conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Nova Conversa
          </Button>
        </div>
      </CardHeader>

      {/* Prompts Rápidos */}
      <div className="p-2.5 bg-muted/10 border-b flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap pl-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Sugestões:
        </span>
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon
          return (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5 shrink-0 bg-background hover:bg-muted/50 gap-1.5"
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              {qp.label}
            </Button>
          )
        })}
      </div>

      {/* Área de Mensagens */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
        {messages.map((m) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-primary text-primary-foreground' : 'bg-muted border text-foreground'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border border-border/80 text-foreground rounded-tl-none'
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[80%] items-center">
            <div className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-card border rounded-2xl px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Consultando suas sessões de mentoria e histórico...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input de Mensagem */}
      <CardFooter className="p-3 bg-card border-t shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex w-full items-center gap-2"
        >
          <Input
            placeholder="Pergunte sobre sua evolução, metas pendentes ou pauta da mentoria..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-sm h-10"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !inputMessage.trim()}
            className="h-10 px-4 font-semibold gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
