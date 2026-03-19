import { Transaction, Lead, Mentee, Client } from './types'

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Consultoria Tech Solutions',
    amount: 15000,
    date: '2026-03-20',
    type: 'Receita',
    status: 'Pago',
    company: 'Grupo Flávio Moura',
    bank: 'Banco Itaú',
    performer: 'Eu',
  },
  {
    id: '2',
    description: 'Licença Software CRM',
    amount: 1200,
    date: '2026-03-22',
    type: 'Despesa',
    status: 'Pendente',
    company: 'FM Tech',
    bank: 'Banco Nubank',
    performer: 'Terceiro',
  },
  {
    id: '3',
    description: 'Mentoria B2B - Alpha Ltda',
    amount: 8000,
    date: '2026-04-05',
    type: 'Receita',
    status: 'Pendente',
    company: 'FM Academy',
    bank: 'Banco Itaú',
    performer: 'Eu',
  },
  {
    id: '4',
    description: 'Marketing Ads',
    amount: 3500,
    date: '2026-03-25',
    type: 'Despesa',
    status: 'Pago',
    company: 'Grupo Flávio Moura',
    bank: 'Banco Nubank',
    performer: 'Terceiro',
  },
]

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Tech Solutions SA',
    value: 25000,
    targetDate: '2026-03-25',
    status: 'Proposta',
    phone: '11999999999',
    company: 'Grupo Flávio Moura',
  },
  {
    id: '2',
    name: 'João Silva (Mentoria)',
    value: 5000,
    targetDate: '2026-03-18',
    status: 'Negociando',
    phone: '11888888888',
    company: 'FM Academy',
  },
  {
    id: '3',
    name: 'Beta Corp',
    value: 40000,
    targetDate: '2026-04-10',
    status: 'Diagnóstico',
    phone: '11777777777',
    company: 'FM Consultoria',
  },
  {
    id: '4',
    name: 'Mega Store',
    value: 12000,
    targetDate: '2026-03-30',
    status: 'Apresentação',
    phone: '11666666666',
    company: 'Grupo Flávio Moura',
  },
]

export const mockMentees: Mentee[] = [
  {
    id: '1',
    name: 'João Silva',
    company: 'FM Academy',
    contractValue: 5000,
    totalSessions: 10,
    sessions: [
      {
        id: 's1',
        date: '2026-03-01',
        duration: 60,
        discussion: 'Alinhamento de metas e objetivos pessoais.',
        tasks: 'Ler livro A, preencher planilha.',
      },
      {
        id: 's2',
        date: '2026-03-15',
        duration: 60,
        discussion: 'Revisão da planilha financeira.',
        tasks: 'Aplicar método 50/30/20.',
      },
    ],
  },
  {
    id: '2',
    name: 'Diretoria Alpha Ltda',
    company: 'Grupo Flávio Moura',
    contractValue: 20000,
    totalSessions: 5,
    sessions: [
      {
        id: 's3',
        date: '2026-02-20',
        duration: 120,
        discussion: 'Diagnóstico corporativo.',
        tasks: 'Levantamento de DRE.',
      },
    ],
  },
]

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Alpha Ltda',
    isB2B: true,
    companyName: 'Alpha Ltda',
    phone: '1133333333',
    email: 'contato@alpha.com',
    contacts: [
      { name: 'Carlos', role: 'CEO', phone: '11911111111' },
      { name: 'Ana', role: 'CFO', phone: '11922222222' },
    ],
  },
  {
    id: '2',
    name: 'João Silva',
    isB2B: false,
    phone: '11888888888',
    email: 'joao@email.com',
    birthday: '1990-03-22',
  },
]
