import { useAuth, checkIsAdmin } from '@/hooks/use-auth'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CalendarDays,
  GraduationCap,
  Target,
  BookOpen,
  Gift,
  Info,
  Lightbulb,
} from 'lucide-react'

export default function Sobre() {
  const { user } = useAuth()
  const isAdmin = checkIsAdmin(user)
  const isClient = user?.role === 'client'

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'client'],
      description: 'Visão geral e métricas principais do sistema.',
      steps: [
        'Acesse o Dashboard pelo menu principal da barra lateral.',
        'Visualize os cards de resumo para um panorama rápido dos números.',
        'Acompanhe os gráficos e tabelas para entender tendências e resultados.',
      ],
      tips: 'Os dados são atualizados em tempo real conforme as operações no sistema.',
    },
    {
      id: 'crm',
      title: 'Gestão de Clientes & CRM',
      icon: Users,
      roles: ['admin'],
      description:
        'Controle de clientes (v1_clientes), funil de vendas (v1_deals) e propostas (v1_proposals).',
      steps: [
        'Na aba de Clientes, adicione novos registros informando nome, email e telefone.',
        'No Funil de Vendas (CRM), crie e mova os cards (deals) entre as etapas (stage) para refletir a jornada do cliente.',
        'Crie propostas comerciais vinculadas aos negócios em andamento e acompanhe seu status.',
      ],
      tips: 'Mantenha o status dos negócios atualizado para gerar métricas precisas de conversão no Dashboard.',
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      roles: ['admin'],
      description:
        'Gestão de transações (v1_transactions), contas financeiras (v1_contas_financeiras) e recibos (v1_recibos).',
      steps: [
        'Cadastre contas bancárias ou carteiras no módulo de Contas para controlar diferentes saldos.',
        'Registre entradas e saídas, categorizando cada transação adequadamente.',
        'Gere recibos de pagamento; o sistema criará o documento automaticamente usando o formato REC-YYYY-XXXXX.',
        'Utilize o recurso de conciliação para garantir o fechamento correto do mês.',
      ],
      tips: 'Ao gerar um recibo, ele fica vinculado à transação original, facilitando auditorias futuras.',
    },
    {
      id: 'agendamentos',
      title: 'Agendamentos',
      icon: CalendarDays,
      roles: ['admin', 'client', 'mentee'],
      description:
        'Gerenciamento de horários (v1_time_slots), profissionais (v1_profissionais) e serviços (v1_servicos).',
      steps: isAdmin
        ? [
            'Configure profissionais e os serviços prestados no módulo administrativo.',
            'Defina os horários disponíveis (v1_time_slots) no calendário para liberação de agenda.',
            'Visualize e gerencie os agendamentos recebidos (v1_agendamentos).',
          ]
        : [
            'Acesse o portal ou link de agendamento.',
            'Escolha o serviço desejado, o profissional e um horário disponível no calendário.',
            'Confirme seus dados e finalize a marcação.',
          ],
      tips: 'Cancelamentos ou reagendamentos devem ser comunicados com antecedência para liberar a agenda.',
    },
    {
      id: 'mentoria',
      title: 'Mentoria',
      icon: GraduationCap,
      roles: ['admin', 'mentee'],
      description: 'Acompanhamento de mentorados (v1_mentees) e registro de sessões (v1_sessoes).',
      steps: isAdmin
        ? [
            'Acompanhe o progresso geral e o consumo de sessões de cada mentorado.',
            'Adicione notas, tarefas e discussões de forma estruturada após cada sessão.',
          ]
        : [
            'Acompanhe seu progresso e os horários das próximas sessões.',
            'Verifique tarefas ou materiais discutidos com o seu mentor.',
          ],
      tips: 'O histórico completo de sessões fica salvo no prontuário para consulta rápida.',
    },
    {
      id: 'saas',
      title: 'DISC & Créditos SaaS',
      icon: Target,
      roles: ['admin', 'client'],
      description:
        'Funcionamento dos pacotes de créditos (v1_saas_credit_packages), links DISC (v1_disc_links) e relatórios (v1_saas_results).',
      steps: [
        'Adquira pacotes de créditos na Loja (Assinatura/Créditos).',
        'Utilize os créditos para gerar links únicos de assessments e testes DISC.',
        'Compartilhe os links gerados com os respondentes da sua organização.',
        'Visualize os relatórios e diagnósticos consolidados na aba Resultados.',
      ],
      tips: 'O consumo de créditos ocorre no momento da geração dos links ou processamento dos resultados.',
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca',
      icon: BookOpen,
      roles: ['admin'],
      description: 'Gestão de acervo de livros e materiais de referência (v1_biblioteca).',
      steps: [
        'Cadastre novos títulos informando autor, categoria e descrição.',
        'Atualize seu status de leitura para organizar o que já foi lido ou está em progresso.',
        'Utilize os filtros e pesquisa para encontrar materiais rapidamente.',
      ],
      tips: 'Você pode marcar livros como favoritos para acesso rápido posteriormente.',
    },
    {
      id: 'bonificacoes',
      title: 'Bonificações (Admin Only)',
      icon: Gift,
      roles: ['admin'],
      description: 'Concessão manual de créditos bônus aos clientes.',
      steps: [
        'Acesse o painel administrativo de créditos do SaaS.',
        'Selecione o cliente desejado e insira a quantidade de créditos bônus a conceder.',
        'Adicione uma nota justificando a concessão (ex: cortesia, erro de processamento).',
      ],
      tips: 'As bonificações refletem imediatamente no saldo do cliente e criam um registro no histórico de transações de crédito.',
    },
  ]

  const visibleSections = sections.filter((s) => {
    if (isAdmin) return true
    return s.roles.includes(user?.role || 'mentee')
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Info className="h-8 w-8 text-primary" />
          Sobre o Sistema
        </h1>
        <p className="text-muted-foreground mt-2">
          Manual completo de operações e funcionalidades.
        </p>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {visibleSections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border bg-card rounded-lg px-4 data-[state=open]:shadow-sm transition-all overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-primary/10 rounded-md">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  <p className="text-sm text-muted-foreground font-normal mt-0.5 leading-snug">
                    {section.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6 border-t mt-2">
              <div className="space-y-6 pl-14 pr-4">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Passo a Passo:</h4>
                  <ol className="list-decimal list-outside space-y-2 text-muted-foreground ml-4 marker:text-primary/70 marker:font-medium">
                    {section.steps.map((step, idx) => (
                      <li key={idx} className="pl-1 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {section.tips && (
                  <Alert className="bg-primary/5 border-primary/20 text-primary-foreground/90">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-medium">Dica / Nota</AlertTitle>
                    <AlertDescription className="text-muted-foreground mt-1">
                      {section.tips}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
