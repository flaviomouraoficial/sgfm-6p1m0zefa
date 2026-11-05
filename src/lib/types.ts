export type Client = {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'Ativo' | 'Inativo'
  createdAt?: string
  empresa_id?: string
  cnpj?: string
  razao_social?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  email_notificacoes?: string
  lgpd_consent?: boolean
  lgpd_consent_date?: string
}

export type Session = {
  id: string
  mentee_id?: string
  client_id?: string
  agendamento_id?: string
  date: string
  projeto?: string
  notes?: string
  type?: string
  duration?: number
  status?: string
  discussion?: string
  tasks?: string
  created?: string
  updated?: string
  expand?: {
    mentee_id?: Mentee
    client_id?: Client
    agendamento_id?: Agendamento
  }
}

export type MenteeStatus = 'Ativo' | 'Concluído' | 'Pausado'

export type Mentee = {
  id: string
  name: string
  company: string
  contractValue: number
  totalSessions: number
  status: MenteeStatus
  phone: string
  email: string
  sessions: Session[]
  emailLogs: any[]
  attachments?: any[]
  empresa_id?: string
}

export type TimeSlot = {
  id: string
  date: string
  time: string
  description?: string
  isBooked: boolean
  menteeName?: string
  menteeEmail?: string
  menteePhone?: string
  menteeCompany?: string
  service?: string
  professional?: string
}

export type Deal = {
  id: string
  title: string
  clientName: string
  value: number
  stage: 'lead' | 'contact' | 'proposal' | 'won' | 'lost'
  createdAt: string
  phone?: string
  email?: string
  notes?: string
  empresa_id?: string
}

export type ProposalStatus = 'em análise' | 'aprovado' | 'reprovado'

export type CondicaoComercial = {
  id?: string
  valor_modulo: number
  valor_global: number
  valor_creditado: number
  valor_liquido: number
  prazo_pagamento: string
}

export type Proposal = {
  id: string
  title: string
  leadId: string
  value: number
  expirationDate: string
  description: string
  status: ProposalStatus
  createdAt: string
  cliente_id?: string
  deal_id?: string
  nome_contato?: string
  nome_evento?: string
  objetivo?: string
  publico_alvo?: string
  cronograma?: string
  local?: string
  formato?: string
  estrutura_programa?: string
  valor_modulo_4h?: number
  valor_modulo_8h?: number
  valor_global?: number
  condicoes_pagamento?: string
  validade_proposta?: string
  data_geracao?: string
  texto_institucional?: string
  condicoes_gerais?: string
  perfil_instrutor?: string
  condicoes_comerciais?: CondicaoComercial[]
  empresa_id?: string
  expand?: {
    cliente_id?: Client
    deal_id?: Deal
    empresa_id?: Empresa
  }
}

export type TransactionType = 'Receita' | 'Despesa'
export type TransactionStatus = 'Pendente' | 'Pago'

export type Attachment = {
  id: string
  name: string
  type: string
  url: string
}

export type ContaFinanceira = {
  id: string
  nome: string
  tipo: 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento'
  saldo_inicial: number
  banco?: string
  agencia?: string
  numero_conta?: string
  chave_pix?: string
  empresa_id?: string
  created?: string
  updated?: string
}

// Formato canônico do campo agencia_conta dos recibos:
// "Ag. {agencia} - C.C {numero_conta}" (+ " - PIX {chave_pix}" quando houver)
export function formatarAgenciaConta(
  conta: Pick<ContaFinanceira, 'agencia' | 'numero_conta' | 'chave_pix'>,
): string {
  if (!conta.agencia && !conta.numero_conta) return ''
  const partes: string[] = []
  if (conta.agencia) partes.push(`Ag. ${conta.agencia}`)
  if (conta.numero_conta) partes.push(`C.C ${conta.numero_conta}`)
  if (conta.chave_pix) partes.push(`PIX ${conta.chave_pix}`)
  return partes.join(' - ')
}

// Rótulo curto exibido em lançamentos/conciliação: "C6 PJ — C6 Bank (336), Ag. 0001 · C.C 34188353-0"
export function rotuloContaBancaria(
  conta: Pick<ContaFinanceira, 'nome' | 'banco' | 'agencia' | 'numero_conta'>,
): string {
  const partes: string[] = []
  if (conta.banco && conta.banco !== conta.nome) partes.push(conta.banco)
  if (conta.agencia || conta.numero_conta) {
    const det = [
      conta.agencia ? `Ag. ${conta.agencia}` : '',
      conta.numero_conta ? `C.C ${conta.numero_conta}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    partes.push(det)
  }
  return partes.length ? `${conta.nome} — ${partes.join(', ')}` : conta.nome
}

export type FiscalOperationMode = 'teste_2026' | 'transicao_2027' | 'regime_atual'
export type FiscalRegime = 'caixa' | 'competencia'

export interface FiscalConfig {
  operationMode: FiscalOperationMode
  cbsAliquota: number
  ibsAliquota: number
  creditoPresumidoPercent?: number
  applySplitPayment: boolean
  observacaoLegal?: string
}

export type RepresentanteLegal = {
  id: string
  nome_completo: string
  nacionalidade: string
  estado_civil: string
  profissao: string
  rg: string
  cpf: string
  email: string
  telefone: string
  is_principal?: boolean
  ativo?: boolean
  empresa_id?: string
  cliente_id?: string
  observacoes?: string
  created?: string
  updated?: string
}

export type Empresa = {
  id: string
  nome: string
  razao_social?: string
  cnpj: string
  inscricao_estadual?: string
  email?: string
  telefone?: string
  endereco?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  email_notificacoes?: string
  is_principal?: boolean
  cor_identificacao?: string
  created?: string
  updated?: string
}

export type Produto = {
  id: string
  codigo: string
  nome: string
  descricao?: string
  ano_publicacao?: number
  preco_compra?: number
  preco_venda: number
  estoque_atual: number
  estoque_minimo?: number
  unidade_medida?: string
  categoria?: string
  empresa_id?: string
  ativo?: boolean
  created?: string
  updated?: string
  expand?: {
    empresa_id?: Empresa
  }
}

export type EstoqueMovimentacao = {
  id: string
  produto_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_unitario?: number
  valor_total?: number
  nf_numero?: string
  data: string
  observacao?: string
  empresa_id?: string
  usuario_id?: string
  created?: string
  updated?: string
  expand?: {
    produto_id?: Produto
    empresa_id?: Empresa
  }
}

export type VendaMaterialItem = {
  produto_id: string
  codigo?: string
  descricao: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
}

export type VendaMaterial = {
  id: string
  numero_pedido: string
  cliente_id: string
  cliente_nome?: string
  cliente_documento?: string
  cliente_endereco?: string
  itens_json: VendaMaterialItem[]
  subtotal: number
  desconto: number
  valor_total: number
  nf_numero?: string
  data_venda: string
  observacoes?: string
  status: 'concluida' | 'pendente' | 'cancelada'
  forma_pagamento?: string
  transacao_id?: string
  empresa_id?: string
  created?: string
  updated?: string
  expand?: {
    cliente_id?: Client
    empresa_id?: Empresa
    transacao_id?: Transaction
  }
}

export type Transaction = {
  id: string
  description: string
  amount: number
  type: TransactionType
  date: string
  entryDate?: string
  classification?: string
  category: string
  status: TransactionStatus
  company?: string
  bank?: string
  service?: string
  paymentMethod?: string
  performer?: string
  client?: string
  supplier?: string
  paymentLink?: string
  attachments?: Attachment[]
  recurringGroupId?: string
  recurrence?: { frequency: string; current: number; total: number }
  updatedAt?: string
  conta_id?: string
  conciliado?: boolean
  recibo_id?: string
  document_number?: string
  amount_bruto?: number
  iva_percent?: number
  iva_amount?: number
  amount_net?: number
  emits_fiscal_doc?: boolean
  fiscal_regime?: FiscalRegime
  cbs_aliquota?: number
  cbs_amount?: number
  ibs_aliquota?: number
  ibs_amount?: number
  split_payment_applied?: boolean
  split_payment_amount?: number
  empresa_id?: string
  expand?: {
    conta_id?: ContaFinanceira
    empresa_id?: Empresa
  }
}

export type Servico = {
  id: string
  nome: string
  duracao_minutos: number
  preco: number
  created_at?: string
}

export type Profissional = {
  id: string
  nome: string
  especialidade?: string
  created_at?: string
}

export type Agendamento = {
  id: string
  profissional_id: string
  servico_id: string
  data_horario: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  status: string
  created_at?: string
  google_event_id?: string
  google_sync_status?: 'synced' | 'pending' | 'error' | 'not_synced' | string
  google_sync_error?: string
  google_synced_at?: string
  expand?: {
    profissional_id?: Profissional
    servico_id?: Servico
    mentee_id?: Mentee
  }
}

export type BookCategory = 'Ficção' | 'Biografia' | 'Autodesenvolvimento' | 'Técnico' | 'Outras'
export type BookReadStatus = 'Não lido' | 'Lendo' | 'Lido'

export type Book = {
  id: string
  titulo: string
  autor: string
  categoria: BookCategory
  palavras_chave?: string
  descricao?: string
  observacoes?: string
  status_leitura: BookReadStatus
  favorito: boolean
  capa_file?: string
  capa_url?: string
  created: string
  updated: string
}

export type ReciboItem = {
  descricao: string
  qtd: number
  valor_unitario: number
  total: number
}

export type Recibo = {
  id: string
  numero: string
  tipo: 'Receber' | 'Pagar'
  status: string
  data_criacao: string
  cliente_nome: string
  cliente_documento?: string
  nf_numero?: string
  nf_data?: string
  nf_descricao?: string
  nf_valor_total?: number
  banco?: string
  agencia_conta?: string
  itens: ReciboItem[]
  subtotal: number
  empresa_id?: string
  created?: string
  updated?: string
}

export type AssessmentLink = {
  id: string
  cliente_id: string
  link_unico: string
  quantidade_permitida: number
  quantidade_usada: number
  status: 'ativo' | 'inativo' | 'expirado'
  data_expiracao?: string
  criado_por: string
  created: string
  updated: string
  expand?: {
    cliente_id?: Client
  }
}

export type AssessmentResposta = {
  id: string
  link_id: string
  cliente_id: string
  nome_respondente: string
  email_respondente: string
  grau_parentesco: string
  atua_na_organizacao: boolean
  respostas_json: Record<string, number>
  status: 'completo' | 'incompleto' | 'em_progresso'
  created: string
  updated: string
  expand?: {
    link_id?: AssessmentLink
    cliente_id?: Client
  }
}

export type AssessmentCalculo = {
  id: string
  resposta_id: string
  pilar_1_media: number
  pilar_2_media: number
  pilar_3_media: number
  pilar_4_media: number
  pilar_5_media: number
  pilar_6_media: number
  pilar_7_media: number
  pilar_8_media: number
  pilar_9_media: number
  mapeamento_agro_media: number
  estado_sucessao: 'verde' | 'amarelo' | 'vermelho'
  created: string
  updated: string
  expand?: {
    resposta_id?: AssessmentResposta
  }
}
