import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Users,
  ShieldCheck,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Save,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { empresasService } from '@/services/empresas'
import { representantesService } from '@/services/representantes'
import { contratosService, AuditoriaCadastralResult } from '@/services/contratos'
import { Empresa, Client, RepresentanteLegal } from '@/lib/types'
import {
  ModuloContrato,
  TestemunhaContrato,
  ModuloAnexo,
  ParticipanteNominal,
} from '@/lib/contratos-types'
import {
  DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA,
  MODELO_PROGRAMA_PADRAO,
} from '@/lib/contrato-verbatim-text'
import { DadosContratoGeracao } from '@/lib/contrato-builder'
import { gerarContratoPDF } from '@/lib/contrato-pdf'
import { exportarContratoDocx } from '@/lib/contrato-docx'
import { SimuladorEncargos } from '@/components/contratos/SimuladorEncargos'
import { ContratoPreview } from '@/components/contratos/ContratoPreview'
import { QuickClientDialog } from '@/components/contratos/QuickClientDialog'
import { diffDays, parseDateBRorISO } from '@/lib/contratos-motor-calculo'

const STORAGE_KEY = 'sgfm_contrato_draft_v1'

export function ContratosPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // Navegação do Wizard
  // Etapa 0: Auditoria de cadastro
  // Etapa 1: Partes
  // Etapa 2: Objeto e Vigência
  // Etapa 3: Tabela de Módulos
  // Etapa 4: Condições Específicas
  // Etapa 5: Anexo Único
  // Etapa 6: Emissão Final e Download
  const [currentStep, setCurrentStep] = useState(0)

  // Dados do Banco
  const [empresasEmissoras, setEmpresasEmissoras] = useState<Empresa[]>([])
  const [clientes, setClientes] = useState<Client[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Entidades Selecionadas
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')

  // Representantes Ativos
  const [repsContratada, setRepsContratada] = useState<RepresentanteLegal[]>([])
  const [repsContratante, setRepsContratante] = useState<RepresentanteLegal[]>([])
  const [selectedRepContratadaId, setSelectedRepContratadaId] = useState<string>('')
  const [selectedRepContratanteId, setSelectedRepContratanteId] = useState<string>('')

  // Auditoria Cadastral
  const [auditoria, setAuditoria] = useState<AuditoriaCadastralResult>({
    completo: false,
    pendenciasContratada: [],
    pendenciasContratante: [],
    todasPendencias: [],
  })

  // Quick Client Dialog
  const [quickClientOpen, setQuickClientOpen] = useState(false)

  // Estado do Contrato (Rascunho)
  const [numeroContrato, setNumeroContrato] = useState('CT-TREND-001/2026')

  // Partes (Editáveis inline com selo de carregado)
  const [contratadaEdit, setContratadaEdit] = useState({
    nome: '',
    razao_social: '',
    cnpj: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Londrina',
    estado: 'PR',
    telefone: '',
    email_notificacoes: '',
  })

  const [repContratadaEdit, setRepContratadaEdit] = useState({
    nome_completo: '',
    nacionalidade: 'brasileiro',
    estado_civil: 'casado',
    profissao: 'consultor empresarial',
    rg: '',
    cpf: '',
    email: '',
  })

  const [contratanteEdit, setContratanteEdit] = useState({
    nome: '',
    razao_social: '',
    cnpj: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    email_notificacoes: '',
  })

  const [repContratanteEdit, setRepContratanteEdit] = useState({
    nome_completo: '',
    nacionalidade: 'brasileiro(a)',
    estado_civil: 'casado(a)',
    profissao: '',
    rg: '',
    cpf: '',
    email: '',
  })

  // Etapa 1: Aceite da Declaração
  const [declaracaoAceite, setDeclaracaoAceite] = useState(false)
  const [aceiteRegistro, setAceiteRegistro] = useState<{
    dataHora: string
    usuarioNome: string
    ip: string
  } | null>(null)

  // Etapa 2: Objeto e Vigência
  const [objetoDescricao, setObjetoDescricao] = useState(MODELO_PROGRAMA_PADRAO.objeto_sugerido)
  const [dataInicio, setDataInicio] = useState('2026-10-03')
  const [dataTermino, setDataTermino] = useState('2026-11-14')
  const [dataAssinatura, setDataAssinatura] = useState(() =>
    new Date().toISOString().substring(0, 10),
  )

  // Etapa 3: Tabela de Módulos
  const [modulos, setModulos] = useState<ModuloContrato[]>([
    {
      id: 'm1',
      ordem: 1,
      servico: 'Módulo 1 – LIDERANÇA EFICAZ',
      data_ou_periodo: '03/10/2026, das 8h às 12h',
      data_referencia_inicio: '2026-10-03',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '10/10/2026',
      participantes_nominais: [],
    },
    {
      id: 'm2',
      ordem: 2,
      servico: 'Módulo 2 – COMUNICAÇÃO ASSERTIVA E FEEDBACK',
      data_ou_periodo: '17/10/2026, das 8h às 12h',
      data_referencia_inicio: '2026-10-17',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '24/10/2026',
      participantes_nominais: [],
    },
    {
      id: 'm3',
      ordem: 3,
      servico: 'Módulo 3 – GESTÃO DE CONFLITOS E INTELIGÊNCIA EMOCIONAL',
      data_ou_periodo: '31/10/2026, das 8h às 12h',
      data_referencia_inicio: '2026-10-31',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '07/11/2026',
      participantes_nominais: [],
    },
    {
      id: 'm4',
      ordem: 4,
      servico: 'Módulo 4 – ORIENTAÇÃO PARA RESULTADOS',
      data_ou_periodo: '14/11/2026, das 8h às 12h',
      data_referencia_inicio: '2026-11-14',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '21/11/2026',
      participantes_nominais: [],
    },
  ])

  // Etapa 4: Condições Específicas
  const [formatoGeral, setFormatoGeral] = useState<'Presencial' | 'Online' | 'Hibrido'>(
    'Presencial',
  )
  const [localInfraestrutura, setLocalInfraestrutura] = useState(
    'Auditório principal e instalações fornecidas pela CONTRATANTE',
  )
  const [plataformaVideoconferencia, setPlataformaVideoconferencia] =
    useState('Zoom / Microsoft Teams')
  const [provedorAcessoPlataforma, setProvedorAcessoPlataforma] = useState(
    'Fornecido pela CONTRATANTE',
  )

  const [despesasViagemAtivas, setDespesasViagemAtivas] = useState(true)
  const [despesasTransporte, setDespesasTransporte] = useState(
    'passagem aérea ida e volta Londrina/PR comprada pela CONTRATADA e reembolsada pela CONTRATANTE mediante comprovação.',
  )
  const [despesasHospedagem, setDespesasHospedagem] = useState(
    '1 (uma) diária em hotel categoria executiva no dia anterior ao treinamento, custeada pela CONTRATANTE.',
  )
  const [despesasAlimentacao, setDespesasAlimentacao] = useState(
    'ajuda de custo fixa por dia de treinamento, paga pela CONTRATANTE junto com a parcela do módulo.',
  )
  const [despesasDeslocamentoLocal, setDespesasDeslocamentoLocal] = useState(
    'traslado aeroporto-hotel-local de treinamento sob responsabilidade da CONTRATANTE.',
  )

  const [haveraTestemunhas, setHaveraTestemunhas] = useState(false)
  const [testemunhas, setTestemunhas] = useState<TestemunhaContrato[]>([
    { nome: '', rg: '' },
    { nome: '', rg: '' },
  ])
  const [consultorResponsavel, setConsultorResponsavel] = useState('Flávio Moura')

  // Etapa 5: Anexo Único
  const [anexoPropostaNumero, setAnexoPropostaNumero] = useState('01/2026')
  const [anexoPropostaData, setAnexoPropostaData] = useState('24/10/2026')
  const [anexoPropostaValidade, setAnexoPropostaValidade] = useState('30 dias')
  const [anexoProgramaNome, setAnexoProgramaNome] = useState(MODELO_PROGRAMA_PADRAO.nome)
  const [anexoModulos, setAnexoModulos] = useState<ModuloAnexo[]>(
    MODELO_PROGRAMA_PADRAO.anexo_ementas_exemplo.map((item, idx) => ({
      id: `anexo-m${idx}`,
      titulo: item.titulo,
      carga_horaria: item.carga_horaria,
      topicos: item.topicos,
    })),
  )

  // Gerando PDF e salvando
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [savingContrato, setSavingContrato] = useState(false)

  // Totais
  const valorTotal = useMemo(() => {
    return modulos.reduce((acc, m) => acc + (Number(m.valor_parcela) || 0), 0)
  }, [modulos])

  const cargaHorariaTotal = useMemo(() => {
    return modulos.reduce((acc, m) => acc + (Number(m.carga_horaria_horas) || 0), 0)
  }, [modulos])

  // Verificação de prazo máximo de 12 meses
  const alerta12MesesExcedido = useMemo(() => {
    const dAss = parseDateBRorISO(dataAssinatura)
    const dTerm = parseDateBRorISO(dataTermino)
    if (!dAss || !dTerm) return false
    const dias = diffDays(dTerm, dAss)
    return dias > 365
  }, [dataAssinatura, dataTermino])

  // Participantes ≤ 5 com pendência nominal
  const temPendenciaNominal = useMemo(() => {
    return modulos.some(
      (m) =>
        m.participantes_max <= 5 &&
        (!m.participantes_nominais || m.participantes_nominais.length < m.participantes_max),
    )
  }, [modulos])

  // =========================================================================
  // CARREGAR DADOS INICIAIS DO BANCO
  // =========================================================================
  const carregarDadosBanco = async () => {
    try {
      setLoadingData(true)
      // 1. Empresas emissoras (Trend e F7)
      const empList = await empresasService.list()
      const emissoras = empList.filter(
        (e) =>
          e.nome.toLowerCase().includes('trend') ||
          e.nome.toLowerCase().includes('f7') ||
          e.is_principal,
      )
      setEmpresasEmissoras(emissoras.length > 0 ? emissoras : empList)

      // Selecionar Trend por padrão se existir
      const trend = emissoras.find((e) => e.nome.toLowerCase().includes('trend')) || emissoras[0]
      if (trend && !selectedEmpresaId) {
        setSelectedEmpresaId(trend.id)
      }

      // 2. Clientes contratantes
      const cliList = await pb.collection('v1_clientes').getFullList<Client>({
        sort: 'name',
      })
      setClientes(cliList)

      // Gerar número de contrato sugerido
      const proximoNum = await contratosService.gerarProximoNumero(trend?.nome)
      setNumeroContrato(proximoNum)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Falha ao buscar empresas e clientes.',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    carregarDadosBanco()
  }, [])

  // Auto-save rascunho em localStorage
  useEffect(() => {
    try {
      const draft = {
        selectedEmpresaId,
        selectedClienteId,
        selectedRepContratadaId,
        selectedRepContratanteId,
        numeroContrato,
        objetoDescricao,
        dataInicio,
        dataTermino,
        dataAssinatura,
        modulos,
        formatoGeral,
        localInfraestrutura,
        plataformaVideoconferencia,
        despesasViagemAtivas,
        haveraTestemunhas,
        testemunhas,
        consultorResponsavel,
        anexoProgramaNome,
        declaracaoAceite,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* intentionally ignored */
    }
  }, [
    selectedEmpresaId,
    selectedClienteId,
    selectedRepContratadaId,
    selectedRepContratanteId,
    numeroContrato,
    objetoDescricao,
    dataInicio,
    dataTermino,
    dataAssinatura,
    modulos,
    formatoGeral,
    localInfraestrutura,
    plataformaVideoconferencia,
    despesasViagemAtivas,
    haveraTestemunhas,
    testemunhas,
    consultorResponsavel,
    anexoProgramaNome,
    declaracaoAceite,
  ])

  // =========================================================================
  // CARREGAR DADOS AO SELECIONAR CONTRATADA (EMPRESA)
  // =========================================================================
  const atualizarDadosContratada = async (empresaId: string) => {
    if (!empresaId) return
    const emp = empresasEmissoras.find((e) => e.id === empresaId)
    if (!emp) return

    setContratadaEdit({
      nome: emp.nome,
      razao_social: emp.razao_social || emp.nome,
      cnpj: emp.cnpj,
      logradouro: emp.logradouro || emp.endereco || '',
      numero: emp.numero || '',
      complemento: emp.complemento || '',
      bairro: emp.bairro || '',
      cidade: emp.cidade || 'Londrina',
      estado: emp.estado || 'PR',
      telefone: emp.telefone || '',
      email_notificacoes: emp.email_notificacoes || emp.email || 'flavio@trendconsultoria.com.br',
    })

    // Carregar representantes da empresa
    const reps = await representantesService.listByEmpresa(empresaId)
    setRepsContratada(reps)
    const principal = reps.find((r) => r.is_principal && r.ativo !== false) || reps[0]

    if (principal) {
      setSelectedRepContratadaId(principal.id)
      setRepContratadaEdit({
        nome_completo: principal.nome_completo,
        nacionalidade: principal.nacionalidade,
        estado_civil: principal.estado_civil,
        profissao: principal.profissao,
        rg: principal.rg,
        cpf: principal.cpf,
        email: principal.email,
      })
      setConsultorResponsavel(principal.nome_completo)
    } else {
      setSelectedRepContratadaId('')
      setRepContratadaEdit({
        nome_completo: '',
        nacionalidade: 'brasileiro',
        estado_civil: 'casado',
        profissao: 'consultor empresarial',
        rg: '',
        cpf: '',
        email: '',
      })
    }
  }

  useEffect(() => {
    if (selectedEmpresaId) {
      atualizarDadosContratada(selectedEmpresaId)
    }
  }, [selectedEmpresaId, empresasEmissoras])

  // Troca de representante da Contratada
  const handleTrocarRepContratada = (repId: string) => {
    setSelectedRepContratadaId(repId)
    const rep = repsContratada.find((r) => r.id === repId)
    if (rep) {
      setRepContratadaEdit({
        nome_completo: rep.nome_completo,
        nacionalidade: rep.nacionalidade,
        estado_civil: rep.estado_civil,
        profissao: rep.profissao,
        rg: rep.rg,
        cpf: rep.cpf,
        email: rep.email,
      })
    }
  }

  // =========================================================================
  // CARREGAR DADOS AO SELECIONAR CONTRATANTE (CLIENTE)
  // =========================================================================
  const atualizarDadosContratante = async (clienteId: string) => {
    if (!clienteId) return
    const cli = clientes.find((c) => c.id === clienteId)
    if (!cli) return

    setContratanteEdit({
      nome: cli.name,
      razao_social: cli.razao_social || cli.name,
      cnpj: cli.cnpj || '',
      logradouro: cli.logradouro || '',
      numero: cli.numero || '',
      complemento: cli.complemento || '',
      bairro: cli.bairro || '',
      cidade: cli.cidade || '',
      estado: cli.estado || '',
      email_notificacoes: cli.email_notificacoes || cli.email || '',
    })

    // Carregar representantes do cliente
    const reps = await representantesService.listByCliente(clienteId)
    setRepsContratante(reps)
    const principal = reps.find((r) => r.is_principal && r.ativo !== false) || reps[0]

    if (principal) {
      setSelectedRepContratanteId(principal.id)
      setRepContratanteEdit({
        nome_completo: principal.nome_completo,
        nacionalidade: principal.nacionalidade,
        estado_civil: principal.estado_civil,
        profissao: principal.profissao,
        rg: principal.rg,
        cpf: principal.cpf,
        email: principal.email,
      })
    } else {
      setSelectedRepContratanteId('')
      setRepContratanteEdit({
        nome_completo: '',
        nacionalidade: 'brasileiro(a)',
        estado_civil: 'casado(a)',
        profissao: '',
        rg: '',
        cpf: '',
        email: '',
      })
    }
  }

  useEffect(() => {
    if (selectedClienteId) {
      atualizarDadosContratante(selectedClienteId)
    }
  }, [selectedClienteId, clientes])

  // Troca de representante da Contratante
  const handleTrocarRepContratante = (repId: string) => {
    setSelectedRepContratanteId(repId)
    const rep = repsContratante.find((r) => r.id === repId)
    if (rep) {
      setRepContratanteEdit({
        nome_completo: rep.nome_completo,
        nacionalidade: rep.nacionalidade,
        estado_civil: rep.estado_civil,
        profissao: rep.profissao,
        rg: rep.rg,
        cpf: rep.cpf,
        email: rep.email,
      })
    }
  }

  // =========================================================================
  // ETAPA ZERO: AUDITORIA DE CADASTRO
  // =========================================================================
  const executarAuditoria = () => {
    const emp = empresasEmissoras.find((e) => e.id === selectedEmpresaId) || null
    const repEmp = repsContratada.find((r) => r.id === selectedRepContratadaId) || null
    const cli = clientes.find((c) => c.id === selectedClienteId) || null
    const repCli = repsContratante.find((r) => r.id === selectedRepContratanteId) || null

    const resultado = contratosService.auditarCadastros(emp, repEmp, cli, repCli)
    setAuditoria(resultado)
    return resultado
  }

  useEffect(() => {
    executarAuditoria()
  }, [
    selectedEmpresaId,
    selectedClienteId,
    selectedRepContratadaId,
    selectedRepContratanteId,
    empresasEmissoras,
    clientes,
    repsContratada,
    repsContratante,
  ])

  // =========================================================================
  // GESTÃO DA TABELA DE MÓDULOS (ETAPA 3)
  // =========================================================================
  const adicionarModulo = () => {
    const novoIndex = modulos.length + 1
    const novoModulo: ModuloContrato = {
      id: `m_${Date.now()}`,
      ordem: novoIndex,
      servico: `Módulo ${novoIndex} – Novo Módulo de Treinamento`,
      data_ou_periodo: 'Data a definir',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: 'A definir',
      participantes_nominais: [],
    }
    setModulos([...modulos, novoModulo])
  }

  const removerModulo = (id: string) => {
    if (modulos.length <= 1) {
      toast({
        title: 'Mínimo de 1 módulo',
        description: 'O contrato deve possuir pelo menos um módulo de treinamento.',
        variant: 'destructive',
      })
      return
    }
    setModulos(modulos.filter((m) => m.id !== id))
  }

  const updateModuloField = (id: string, field: keyof ModuloContrato, value: any) => {
    setModulos((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const updated = { ...m, [field]: value }

        // Se participantes_max <= 5, ajustar array nominal se necessário
        if (field === 'participantes_max' && Number(value) <= 5) {
          const maxNum = Number(value)
          const nominais = updated.participantes_nominais || []
          while (nominais.length < maxNum) {
            nominais.push({ nome_completo: '', cpf: '' })
          }
          updated.participantes_nominais = nominais.slice(0, maxNum)
        }
        return updated
      }),
    )
  }

  const updateParticipanteNominal = (
    moduloId: string,
    pIdx: number,
    field: 'nome_completo' | 'cpf',
    val: string,
  ) => {
    setModulos((prev) =>
      prev.map((m) => {
        if (m.id !== moduloId) return m
        const nominais = [...(m.participantes_nominais || [])]
        if (!nominais[pIdx]) {
          nominais[pIdx] = { nome_completo: '', cpf: '' }
        }
        nominais[pIdx][field] = val
        return { ...m, participantes_nominais: nominais }
      }),
    )
  }

  // =========================================================================
  // GESTÃO DE TESTEMUNHAS E ANEXO
  // =========================================================================
  const adicionarTestemunha = () => {
    if (testemunhas.length >= 4) {
      toast({
        title: 'Limite atingido',
        description: 'É permitido adicionar no máximo 4 testemunhas.',
      })
      return
    }
    setTestemunhas([...testemunhas, { nome: '', rg: '' }])
  }

  const removerTestemunha = (idx: number) => {
    setTestemunhas(testemunhas.filter((_, i) => i !== idx))
  }

  const adicionarTopicoEmenta = (modIdx: number) => {
    setAnexoModulos((prev) =>
      prev.map((m, i) => {
        if (i !== modIdx) return m
        return { ...m, topicos: [...m.topicos, 'Novo tópico'] }
      }),
    )
  }

  // =========================================================================
  // AVANÇAR ETAPAS COM VALIDAÇÃO
  // =========================================================================
  const avancarEtapa = () => {
    // Validação da Etapa 0
    if (currentStep === 0) {
      const res = executarAuditoria()
      if (!res.completo) {
        toast({
          title: 'Cadastros Incompletos',
          description:
            'A auditoria encontrou pendências obrigatórias. Regularize antes de prosseguir.',
          variant: 'destructive',
        })
        return
      }
    }

    // Validação da Etapa 1
    if (currentStep === 1) {
      if (!contratanteEdit.email_notificacoes) {
        toast({
          title: 'E-mail de Notificações Obrigatório',
          description:
            'O e-mail para notificações da Contratante é obrigatório e alimenta a Cláusula Décima Oitava.',
          variant: 'destructive',
        })
        return
      }
      if (!declaracaoAceite) {
        toast({
          title: 'Aceite Obrigatório',
          description:
            'É obrigatório confirmar o aceite da declaração de destinação empresarial para avançar.',
          variant: 'destructive',
        })
        return
      }

      // Gravar registro de aceite com data, hora, usuário e IP
      if (!aceiteRegistro) {
        setAceiteRegistro({
          dataHora: new Date().toLocaleString('pt-BR'),
          usuarioNome: user?.name || user?.email || 'Administrador SGFM',
          ip: '127.0.0.1 (Auditoria Interna SGFM)',
        })
      }
    }

    // Validação da Etapa 2
    if (currentStep === 2) {
      if (!objetoDescricao || !dataInicio || !dataTermino) {
        toast({
          title: 'Campos Obrigatórios',
          description: 'Preencha a descrição do objeto e as datas de início e término.',
          variant: 'destructive',
        })
        return
      }
    }

    // Validação da Etapa 3
    if (currentStep === 3) {
      if (modulos.length === 0) {
        toast({
          title: 'Tabela Vazia',
          description: 'Adicione pelo menos um módulo de treinamento.',
          variant: 'destructive',
        })
        return
      }
    }

    // Validação da Etapa 5 (Anexo Único - sem opções pendentes)
    if (currentStep === 5) {
      if (!anexoProgramaNome) {
        toast({
          title: 'Nome do Programa',
          description: 'O nome do programa no Anexo Único é obrigatório.',
          variant: 'destructive',
        })
        return
      }
    }

    setCurrentStep((prev) => Math.min(6, prev + 1))
  }

  const voltarEtapa = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  // =========================================================================
  // DADOS CONSOLIDADOS PARA PREVIEW E GERAÇÃO
  // =========================================================================
  const dadosContratoConsolidados: DadosContratoGeracao = useMemo(() => {
    const endContratada = [
      contratadaEdit.logradouro,
      contratadaEdit.numero,
      contratadaEdit.complemento,
      contratadaEdit.bairro,
    ]
      .filter(Boolean)
      .join(', ')

    const endContratante = [
      contratanteEdit.logradouro,
      contratanteEdit.numero,
      contratanteEdit.complemento,
      contratanteEdit.bairro,
    ]
      .filter(Boolean)
      .join(', ')

    const dAss = parseDateBRorISO(dataAssinatura) || new Date()
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ]
    const dataExtenso = `${dAss.getDate()} de ${meses[dAss.getMonth()]} de ${dAss.getFullYear()}`

    return {
      numeroContrato,
      contratadaNome: contratadaEdit.nome,
      contratadaRazaoSocial: contratadaEdit.razao_social,
      contratadaCnpj: contratadaEdit.cnpj,
      contratadaEnderecoCompleto: endContratada || 'Rua Senador Souza Naves, 425, Centro',
      contratadaCidadeUf: `${contratadaEdit.cidade || 'Londrina'}/${contratadaEdit.estado || 'PR'}`,
      contratadaTelefone: contratadaEdit.telefone,
      contratadaEmailNotificacoes: contratadaEdit.email_notificacoes,
      repContratadaNome: repContratadaEdit.nome_completo,
      repContratadaNacionalidade: repContratadaEdit.nacionalidade,
      repContratadaEstadoCivil: repContratadaEdit.estado_civil,
      repContratadaProfissao: repContratadaEdit.profissao,
      repContratadaRg: repContratadaEdit.rg,
      repContratadaCpf: repContratadaEdit.cpf,
      repContratadaEmail: repContratadaEdit.email,

      contratanteNome: contratanteEdit.nome,
      contratanteRazaoSocial: contratanteEdit.razao_social,
      contratanteCnpj: contratanteEdit.cnpj,
      contratanteEnderecoCompleto: endContratante || 'Endereço da Contratante',
      contratanteCidadeUf: `${contratanteEdit.cidade || 'Londrina'}/${contratanteEdit.estado || 'PR'}`,
      contratanteEmailNotificacoes: contratanteEdit.email_notificacoes,
      repContratanteNome: repContratanteEdit.nome_completo,
      repContratanteNacionalidade: repContratanteEdit.nacionalidade,
      repContratanteEstadoCivil: repContratanteEdit.estado_civil,
      repContratanteProfissao: repContratanteEdit.profissao,
      repContratanteRg: repContratanteEdit.rg,
      repContratanteCpf: repContratanteEdit.cpf,
      repContratanteEmail: repContratanteEdit.email,

      objetoDescricao,
      dataInicioExtenso: dataInicio,
      dataTerminoExtenso: dataTermino,
      dataAssinaturaExtenso: dataExtenso,
      cidadeDataAssinatura: `Londrina-PR, ${dataExtenso}`,

      modulos,
      valorTotal,
      cargaHorariaTotal,

      formatoGeral,
      localInfraestrutura,
      plataformaVideoconferencia,
      provedorAcessoPlataforma,

      despesasViagemAtivas,
      despesasTransporte,
      despesasHospedagem,
      despesasAlimentacao,
      despesasDeslocamentoLocal,

      haveraTestemunhas,
      testemunhas: haveraTestemunhas ? testemunhas : [],
      consultorResponsavel,

      anexoPropostaNumero,
      anexoPropostaData,
      anexoPropostaValidade,
      anexoProgramaNome,
      anexoModulos,

      aceiteDataHora: aceiteRegistro?.dataHora || new Date().toLocaleString('pt-BR'),
      aceiteUsuarioNome: aceiteRegistro?.usuarioNome || user?.name || 'Administrador',
      aceiteIp: aceiteRegistro?.ip || '127.0.0.1 (Conexão Segura)',
    }
  }, [
    numeroContrato,
    contratadaEdit,
    repContratadaEdit,
    contratanteEdit,
    repContratanteEdit,
    objetoDescricao,
    dataInicio,
    dataTermino,
    dataAssinatura,
    modulos,
    valorTotal,
    cargaHorariaTotal,
    formatoGeral,
    localInfraestrutura,
    plataformaVideoconferencia,
    provedorAcessoPlataforma,
    despesasViagemAtivas,
    despesasTransporte,
    despesasHospedagem,
    despesasAlimentacao,
    despesasDeslocamentoLocal,
    haveraTestemunhas,
    testemunhas,
    consultorResponsavel,
    anexoPropostaNumero,
    anexoPropostaData,
    anexoPropostaValidade,
    anexoProgramaNome,
    anexoModulos,
    aceiteRegistro,
    user,
  ])

  // =========================================================================
  // GERAÇÃO E DOWNLOAD DE PDF E DOCX
  // =========================================================================
  const handleBaixarPdf = async () => {
    try {
      setGeneratingPdf(true)
      const blob = await gerarContratoPDF(dadosContratoConsolidados)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${numeroContrato.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'PDF Gerado com Sucesso',
        description: 'O download do contrato em formato A4 foi iniciado.',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao gerar PDF',
        description: err.message || 'Falha ao processar o documento PDF.',
        variant: 'destructive',
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleBaixarDocx = () => {
    try {
      const blob = exportarContratoDocx(dadosContratoConsolidados)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${numeroContrato.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'DOCX Exportado com Sucesso',
        description: 'O contrato em formato editável do Word foi baixado.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar DOCX',
        description: err.message || 'Falha ao gerar arquivo DOCX.',
        variant: 'destructive',
      })
    }
  }

  const handleSalvarContratoBanco = async (status: 'emitido' | 'rascunho') => {
    try {
      setSavingContrato(true)
      const statusFinal =
        status === 'emitido' && temPendenciaNominal ? 'pendente_participantes' : status

      const payload = {
        numero_contrato: numeroContrato,
        empresa_id: selectedEmpresaId,
        cliente_id: selectedClienteId,
        representante_contratada_id: selectedRepContratadaId || undefined,
        representante_contratante_id: selectedRepContratanteId || undefined,
        status: statusFinal,
        objeto_descricao: objetoDescricao,
        data_inicio: dataInicio,
        data_termino: dataTermino,
        data_assinatura: dataAssinatura,
        limite_12_meses_excedido: alerta12MesesExcedido,
        valor_total: valorTotal,
        carga_horaria_total: cargaHorariaTotal,
        modulos_json: modulos,
        formato_geral: formatoGeral,
        local_infraestrutura: localInfraestrutura,
        plataforma_videoconferencia: plataformaVideoconferencia,
        provedor_acesso_plataforma: provedorAcessoPlataforma,
        despesas_viagem_ativas: despesasViagemAtivas,
        despesas_transporte: despesasTransporte,
        despesas_hospedagem: despesasHospedagem,
        despesas_alimentacao: despesasAlimentacao,
        despesas_deslocamento_local: despesasDeslocamentoLocal,
        havera_testemunhas: haveraTestemunhas,
        testemunhas_json: haveraTestemunhas ? testemunhas : [],
        consultor_responsavel: consultorResponsavel,
        anexo_proposta_numero: anexoPropostaNumero,
        anexo_proposta_data: anexoPropostaData,
        anexo_proposta_validade: anexoPropostaValidade,
        anexo_programa_nome: anexoProgramaNome,
        anexo_modulos_json: anexoModulos,
        declaracao_destinacao_aceite: declaracaoAceite,
        aceite_data_hora: new Date().toISOString(),
        aceite_usuario_id: user?.id,
        aceite_usuario_nome: user?.name || user?.email,
        aceite_ip: '127.0.0.1',
        alerta_participantes_pendentes: temPendenciaNominal,
        snapshot_dados_contrato: dadosContratoConsolidados,
      }

      await contratosService.create(payload)

      toast({
        title: status === 'emitido' ? 'Contrato Emitido e Salvo!' : 'Rascunho Salvo',
        description: `Contrato ${numeroContrato} gravado no banco de dados.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao gravar contrato',
        description: err.message || 'Falha ao salvar no banco.',
        variant: 'destructive',
      })
    } finally {
      setSavingContrato(false)
    }
  }

  const stepsLabels = [
    '0. Auditoria',
    '1. Partes',
    '2. Objeto & Vigência',
    '3. Módulos',
    '4. Condições',
    '5. Anexo Único',
    '6. Emissão & PDF',
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Gerador de Contratos de Treinamento
              </h1>
              <p className="text-xs text-muted-foreground">
                In Company empresarial com preâmbulo qualificado, tabela dinâmica e Anexo Único
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            Nº {numeroContrato}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSalvarContratoBanco('rascunho')}
            disabled={savingContrato}
            className="gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" /> Salvar Rascunho
          </Button>
        </div>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-1.5 p-1 bg-muted/40 border rounded-lg">
        {stepsLabels.map((lbl, idx) => {
          const isActive = currentStep === idx
          const isDone = currentStep > idx
          return (
            <button
              key={idx}
              onClick={() => {
                if (idx < currentStep || auditoria.completo) {
                  setCurrentStep(idx)
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-all ${
                isActive
                  ? 'bg-background shadow-sm text-primary font-bold'
                  : isDone
                    ? 'text-foreground hover:bg-background/50'
                    : 'text-muted-foreground opacity-60 cursor-not-allowed'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border text-[10px] flex items-center justify-center">
                  {idx}
                </span>
              )}
              <span className="truncate">{lbl}</span>
            </button>
          )
        })}
      </div>

      {/* Layout Principal: Formulário + Painel Lateral de Simulação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna da Esquerda: Wizard de Etapas (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================================= */}
          {/* ETAPA ZERO: AUDITORIA DE CADASTRO                                         */}
          {/* ========================================================================= */}
          {currentStep === 0 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Etapa Zero: Auditoria de Cadastro
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Validação prévia obrigatória de completude da entidade emissora e do cliente
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={executarAuditoria}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Revalidar cadastros
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Seletores de Entidades */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Entidade Contratada */}
                  <div className="space-y-2 p-3 border rounded-lg bg-muted/10">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-primary" /> Entidade Emissora (Contratada)
                      *
                    </Label>
                    <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecione Trend ou F7" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresasEmissoras.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            {emp.nome} ({emp.cnpj})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Trend Consultoria e F7 Training são as entidades habilitadas.
                    </p>
                  </div>

                  {/* Cliente Contratante */}
                  <div className="space-y-2 p-3 border rounded-lg bg-muted/10">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" /> Cliente (Contratante) *
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] text-primary p-0"
                        onClick={() => setQuickClientOpen(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Novo Cliente
                      </Button>
                    </div>
                    <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Buscar por Razão Social ou CNPJ" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name} {c.cnpj ? `(${c.cnpj})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Selecione um cliente cadastrado ou crie novo com representante nesta tela.
                    </p>
                  </div>
                </div>

                {/* Status da Auditoria */}
                {auditoria.completo ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm">Auditoria Concluída com Sucesso!</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Todos os dados cadastrais da Contratada e da Contratante estão completos,
                        incluindo qualificação civil e representantes legais principais. O
                        preenchimento do contrato está liberado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg space-y-3 text-rose-900">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <h4 className="font-semibold text-sm">
                        Pendências Cadastrais Detectadas ({auditoria.todasPendencias.length})
                      </h4>
                    </div>
                    <p className="text-xs text-rose-700">
                      O sistema bloqueia a emissão do contrato até que todas as pendências abaixo
                      sejam regularizadas no cadastro correspondente:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {auditoria.pendenciasContratada.length > 0 && (
                        <div className="bg-white/80 p-3 rounded border border-rose-200 text-xs space-y-1">
                          <p className="font-bold text-rose-800">
                            Pendente na Contratada ({auditoria.pendenciasContratada.length}):
                          </p>
                          <ul className="list-disc list-inside text-rose-700 text-[11px] space-y-0.5">
                            {auditoria.pendenciasContratada.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                          <Link
                            to="/admin/configuracoes"
                            className="inline-flex items-center text-[11px] text-primary font-semibold hover:underline pt-1"
                          >
                            Ir para Configurações de Empresas{' '}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      )}

                      {auditoria.pendenciasContratante.length > 0 && (
                        <div className="bg-white/80 p-3 rounded border border-rose-200 text-xs space-y-1">
                          <p className="font-bold text-rose-800">
                            Pendente na Contratante ({auditoria.pendenciasContratante.length}):
                          </p>
                          <ul className="list-disc list-inside text-rose-700 text-[11px] space-y-0.5">
                            {auditoria.pendenciasContratante.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                          <Link
                            to="/admin/clientes"
                            className="inline-flex items-center text-[11px] text-primary font-semibold hover:underline pt-1"
                          >
                            Ir para Cadastro de Clientes <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 1: PARTES                                                           */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Etapa 1: Qualificação das Partes & Destinação Empresarial
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirmação visual dos dados carregados do cadastro com edição inline
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Bloco 1: Contratada */}
                <div className="p-4 border rounded-lg bg-card space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                        Carregado do cadastro
                      </Badge>
                      <h4 className="font-semibold text-sm">Entidade Contratada</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={() => atualizarDadosContratada(selectedEmpresaId)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Atualizar do cadastro
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-xs">Razão Social</Label>
                      <Input
                        className="h-8 text-xs"
                        value={contratadaEdit.razao_social}
                        onChange={(e) =>
                          setContratadaEdit({ ...contratadaEdit, razao_social: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CNPJ</Label>
                      <Input
                        className="h-8 text-xs font-mono"
                        value={contratadaEdit.cnpj}
                        onChange={(e) =>
                          setContratadaEdit({ ...contratadaEdit, cnpj: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-xs">Endereço Completo</Label>
                      <Input
                        className="h-8 text-xs"
                        value={contratadaEdit.logradouro}
                        onChange={(e) =>
                          setContratadaEdit({ ...contratadaEdit, logradouro: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        E-mail Notificações (Cláusula Décima Oitava)
                      </Label>
                      <Input
                        className="h-8 text-xs"
                        value={contratadaEdit.email_notificacoes}
                        onChange={(e) =>
                          setContratadaEdit({
                            ...contratadaEdit,
                            email_notificacoes: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Representante Contratada */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Representante Legal da Contratada:
                      </Label>
                      {repsContratada.length > 1 && (
                        <Select
                          value={selectedRepContratadaId}
                          onValueChange={handleTrocarRepContratada}
                        >
                          <SelectTrigger className="h-7 text-xs w-48">
                            <SelectValue placeholder="Trocar representante" />
                          </SelectTrigger>
                          <SelectContent>
                            {repsContratada.map((r) => (
                              <SelectItem key={r.id} value={r.id} className="text-xs">
                                {r.nome_completo} {r.is_principal ? '(Principal)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Nome"
                        value={repContratadaEdit.nome_completo}
                        onChange={(e) =>
                          setRepContratadaEdit({
                            ...repContratadaEdit,
                            nome_completo: e.target.value,
                          })
                        }
                      />
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="CPF"
                        value={repContratadaEdit.cpf}
                        onChange={(e) =>
                          setRepContratadaEdit({ ...repContratadaEdit, cpf: e.target.value })
                        }
                      />
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="RG"
                        value={repContratadaEdit.rg}
                        onChange={(e) =>
                          setRepContratadaEdit({ ...repContratadaEdit, rg: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Contratante */}
                <div className="p-4 border rounded-lg bg-card space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                        Carregado do cadastro
                      </Badge>
                      <h4 className="font-semibold text-sm">Cliente Contratante</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={() => atualizarDadosContratante(selectedClienteId)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Atualizar do cadastro
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-xs">Razão Social / Nome Fantasia *</Label>
                      <Input
                        className="h-8 text-xs"
                        value={contratanteEdit.razao_social}
                        onChange={(e) =>
                          setContratanteEdit({ ...contratanteEdit, razao_social: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CNPJ *</Label>
                      <Input
                        className="h-8 text-xs font-mono"
                        value={contratanteEdit.cnpj}
                        onChange={(e) =>
                          setContratanteEdit({ ...contratanteEdit, cnpj: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-xs">Endereço Completo</Label>
                      <Input
                        className="h-8 text-xs"
                        value={contratanteEdit.logradouro}
                        onChange={(e) =>
                          setContratanteEdit({ ...contratanteEdit, logradouro: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-primary">
                        E-mail de Notificações (Cláusula Décima Oitava) *
                      </Label>
                      <Input
                        className="h-8 text-xs border-primary/40"
                        value={contratanteEdit.email_notificacoes}
                        onChange={(e) =>
                          setContratanteEdit({
                            ...contratanteEdit,
                            email_notificacoes: e.target.value,
                          })
                        }
                        placeholder="notificacoes@cliente.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Representante Contratante */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Representante Legal da Contratante:
                      </Label>
                      {repsContratante.length > 1 && (
                        <Select
                          value={selectedRepContratanteId}
                          onValueChange={handleTrocarRepContratante}
                        >
                          <SelectTrigger className="h-7 text-xs w-52">
                            <SelectValue placeholder="Trocar representante" />
                          </SelectTrigger>
                          <SelectContent>
                            {repsContratante.map((r) => (
                              <SelectItem key={r.id} value={r.id} className="text-xs">
                                {r.nome_completo} {r.is_principal ? '(Principal)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Nome"
                        value={repContratanteEdit.nome_completo}
                        onChange={(e) =>
                          setRepContratanteEdit({
                            ...repContratanteEdit,
                            nome_completo: e.target.value,
                          })
                        }
                      />
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="CPF"
                        value={repContratanteEdit.cpf}
                        onChange={(e) =>
                          setRepContratanteEdit({ ...repContratanteEdit, cpf: e.target.value })
                        }
                      />
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="RG"
                        value={repContratanteEdit.rg}
                        onChange={(e) =>
                          setRepContratanteEdit({ ...repContratanteEdit, rg: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Declaração de Destinação Empresarial (Leitura Obrigatória + Checkbox) */}
                <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <h4 className="font-bold text-xs uppercase text-amber-900 tracking-wide">
                      Declaração de Destinação Empresarial do Preâmbulo (Leitura Obrigatória)
                    </h4>
                  </div>

                  <div className="p-3 bg-white/90 border border-amber-200 rounded font-serif text-xs text-slate-800 leading-relaxed italic text-justify select-text">
                    "{DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA}"
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="aceite-destinacao"
                      checked={declaracaoAceite}
                      onCheckedChange={(checked) => setDeclaracaoAceite(Boolean(checked))}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="aceite-destinacao"
                      className="text-xs font-medium text-amber-950 cursor-pointer"
                    >
                      Confirmo e atesto o aceite integral da Declaração de Destinação Empresarial
                      acima para este contrato. Registrado eletronicamente para fins de auditoria e
                      afastamento de relações consumeristas.
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 2: OBJETO E VIGÊNCIA                                                */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Etapa 2: Objeto e Período de Vigência
                </CardTitle>
                <CardDescription className="text-xs">
                  Especificação dos serviços profissionais e cálculo do prazo limite de 12 meses
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold">
                      Descrição do Objeto (Cláusula Primeira) *
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-primary"
                      onClick={() =>
                        setObjetoDescricao(
                          `capacitação e desenvolvimento de liderança in company através do ${anexoProgramaNome}`,
                        )
                      }
                    >
                      Sugerir do Programa
                    </Button>
                  </div>
                  <Input
                    className="h-9 text-xs"
                    value={objetoDescricao}
                    onChange={(e) => setObjetoDescricao(e.target.value)}
                    placeholder="Ex: capacitação e desenvolvimento de liderança in company..."
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Será inserido em maiúsculas após "prestação de serviços profissionais de..." na
                    Cláusula Primeira.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Assinatura do Instrumento</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={dataAssinatura}
                      onChange={(e) => setDataAssinatura(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Início da Prestação</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Término da Prestação</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={dataTermino}
                      onChange={(e) => setDataTermino(e.target.value)}
                    />
                  </div>
                </div>

                {/* Alerta de 12 meses */}
                {alerta12MesesExcedido ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      <strong>Atenção (Parágrafo único da Cláusula Primeira):</strong> O término
                      ultrapassa o prazo máximo de 12 meses contados da data de assinatura. O
                      contrato exigirá aditivo formal antes de completar o período.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Vigência dentro do limite legal de 12 meses da Cláusula Primeira.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 3: TABELA DE MÓDULOS                                                */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Etapa 3: Tabela de Módulos (Cláusula Segunda)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Linhas de eventos, parcelas, prazos e identificação nominal quando ≤ 5
                      participantes
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={adicionarModulo} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Linha
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Serviço/Módulo/Evento</TableHead>
                        <TableHead>Data ou período</TableHead>
                        <TableHead className="w-16 text-center">Horas</TableHead>
                        <TableHead className="w-24 text-center">Formato</TableHead>
                        <TableHead className="w-20 text-center">Máx. Part.</TableHead>
                        <TableHead className="w-28 text-right">Parcela (R$)</TableHead>
                        <TableHead className="w-24 text-center">Vencimento</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulos.map((m, idx) => (
                        <React.Fragment key={m.id}>
                          <TableRow className="text-xs">
                            <TableCell>
                              <Input
                                className="h-7 text-xs"
                                value={m.servico}
                                onChange={(e) => updateModuloField(m.id, 'servico', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-7 text-xs"
                                value={m.data_ou_periodo}
                                onChange={(e) =>
                                  updateModuloField(m.id, 'data_ou_periodo', e.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                className="h-7 text-xs text-center"
                                value={m.carga_horaria_horas}
                                onChange={(e) =>
                                  updateModuloField(
                                    m.id,
                                    'carga_horaria_horas',
                                    Number(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={m.formato}
                                onValueChange={(val) => updateModuloField(m.id, 'formato', val)}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Presencial" className="text-xs">
                                    Presencial
                                  </SelectItem>
                                  <SelectItem value="Online" className="text-xs">
                                    Online
                                  </SelectItem>
                                  <SelectItem value="Híbrido" className="text-xs">
                                    Híbrido
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                className="h-7 text-xs text-center"
                                value={m.participantes_max}
                                onChange={(e) =>
                                  updateModuloField(
                                    m.id,
                                    'participantes_max',
                                    Number(e.target.value) || 1,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                className="h-7 text-xs text-right"
                                value={m.valor_parcela}
                                onChange={(e) =>
                                  updateModuloField(
                                    m.id,
                                    'valor_parcela',
                                    Number(e.target.value) || 0,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                className="h-7 text-xs text-center"
                                value={m.vencimento}
                                onChange={(e) =>
                                  updateModuloField(m.id, 'vencimento', e.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => removerModulo(m.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Painel Expansível de Participantes Nominais quando ≤ 5 */}
                          {m.participantes_max <= 5 && (
                            <TableRow className="bg-amber-50/50">
                              <TableCell colSpan={8} className="py-2.5 px-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-amber-700" />
                                      Participantes Nominais Obrigatórios (≤ 5 pessoas):
                                    </span>
                                    <span className="text-[10px] text-muted-foreground italic">
                                      Exigido para comprovação da destinação empresarial
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Array.from({ length: m.participantes_max }).map((_, pIdx) => {
                                      const pNom = m.participantes_nominais?.[pIdx] || {
                                        nome_completo: '',
                                        cpf: '',
                                      }
                                      return (
                                        <div
                                          key={pIdx}
                                          className="flex items-center gap-2 bg-white p-1.5 rounded border border-amber-200"
                                        >
                                          <span className="text-[10px] font-bold text-amber-700 w-4">
                                            {pIdx + 1}º
                                          </span>
                                          <Input
                                            className="h-6 text-xs flex-1"
                                            placeholder="Nome Completo"
                                            value={pNom.nome_completo}
                                            onChange={(e) =>
                                              updateParticipanteNominal(
                                                m.id,
                                                pIdx,
                                                'nome_completo',
                                                e.target.value,
                                              )
                                            }
                                          />
                                          <Input
                                            className="h-6 text-xs w-28 font-mono"
                                            placeholder="CPF"
                                            value={pNom.cpf}
                                            onChange={(e) =>
                                              updateParticipanteNominal(
                                                m.id,
                                                pIdx,
                                                'cpf',
                                                e.target.value,
                                              )
                                            }
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}

                      {/* Linha Fixa: VALOR TOTAL */}
                      <TableRow className="font-bold bg-muted/30 border-t-2">
                        <TableCell>VALOR TOTAL</TableCell>
                        <TableCell className="text-center">—</TableCell>
                        <TableCell className="text-center">{cargaHorariaTotal}h</TableCell>
                        <TableCell className="text-center">—</TableCell>
                        <TableCell className="text-center">—</TableCell>
                        <TableCell className="text-right text-primary">
                          R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">—</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {temPendenciaNominal && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-800 text-xs flex items-center justify-between">
                    <span>
                      <strong>Nota de Flexibilidade:</strong> É permitido emitir o contrato apenas
                      com o quantitativo (nomes depois, por aditivo simples até a data do módulo). O
                      contrato ficará sinalizado com pendência no painel.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 4: CONDIÇÕES ESPECÍFICAS                                            */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Etapa 4: Condições Específicas, Despesas e Testemunhas
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajustes condicionais de execução, supressão da Cláusula Sétima e bloco de
                  assinaturas
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Formato Geral */}
                <div className="space-y-3 p-3 border rounded-lg bg-muted/10">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Formato de Execução Geral</Label>
                    <Select value={formatoGeral} onValueChange={(val: any) => setFormatoGeral(val)}>
                      <SelectTrigger className="h-8 text-xs w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Presencial" className="text-xs">
                          Presencial
                        </SelectItem>
                        <SelectItem value="Online" className="text-xs">
                          Online
                        </SelectItem>
                        <SelectItem value="Hibrido" className="text-xs">
                          Híbrido
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formatoGeral === 'Presencial' ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Local e Infraestrutura Fornecida</Label>
                      <Input
                        className="h-8 text-xs"
                        value={localInfraestrutura}
                        onChange={(e) => setLocalInfraestrutura(e.target.value)}
                        placeholder="Ex: Instalações da Contratante com sala, som e projeção..."
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Plataforma de Videoconferência</Label>
                        <Input
                          className="h-8 text-xs"
                          value={plataformaVideoconferencia}
                          onChange={(e) => setPlataformaVideoconferencia(e.target.value)}
                          placeholder="Zoom / Microsoft Teams"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Provedor de Acesso</Label>
                        <Input
                          className="h-8 text-xs"
                          value={provedorAcessoPlataforma}
                          onChange={(e) => setProvedorAcessoPlataforma(e.target.value)}
                          placeholder="Fornecido pela CONTRATANTE"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Despesas de Viagem (Ativação / Supressão da Cláusula Sétima) */}
                <div className="space-y-3 p-3 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold">Despesas de Viagem e Reembolsos</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Se desativado, suprime a Cláusula Sétima e renumera automaticamente as
                        seguintes.
                      </p>
                    </div>
                    <Button
                      variant={despesasViagemAtivas ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDespesasViagemAtivas(!despesasViagemAtivas)}
                    >
                      {despesasViagemAtivas ? 'Ativado (Cláusula 7ª)' : 'Desativado (Suprimida)'}
                    </Button>
                  </div>

                  {despesasViagemAtivas && (
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Transporte</Label>
                          <Input
                            className="h-7 text-xs"
                            value={despesasTransporte}
                            onChange={(e) => setDespesasTransporte(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Hospedagem</Label>
                          <Input
                            className="h-7 text-xs"
                            value={despesasHospedagem}
                            onChange={(e) => setDespesasHospedagem(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Alimentação</Label>
                          <Input
                            className="h-7 text-xs"
                            value={despesasAlimentacao}
                            onChange={(e) => setDespesasAlimentacao(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Deslocamento Local</Label>
                          <Input
                            className="h-7 text-xs"
                            value={despesasDeslocamentoLocal}
                            onChange={(e) => setDespesasDeslocamentoLocal(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Testemunhas e Consultor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold">
                        Haverá Testemunhas no Instrumento?
                      </Label>
                      <Select
                        value={haveraTestemunhas ? 'sim' : 'nao'}
                        onValueChange={(val) => setHaveraTestemunhas(val === 'sim')}
                      >
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao" className="text-xs">
                            Não
                          </SelectItem>
                          <SelectItem value="sim" className="text-xs">
                            Sim
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {haveraTestemunhas && (
                      <div className="space-y-2 pt-1">
                        {testemunhas.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Input
                              className="h-7 text-xs flex-1"
                              placeholder={`Nome Testemunha ${idx + 1}`}
                              value={t.nome}
                              onChange={(e) => {
                                const arr = [...testemunhas]
                                arr[idx].nome = e.target.value
                                setTestemunhas(arr)
                              }}
                            />
                            <Input
                              className="h-7 text-xs w-28 font-mono"
                              placeholder="RG"
                              value={t.rg}
                              onChange={(e) => {
                                const arr = [...testemunhas]
                                arr[idx].rg = e.target.value
                                setTestemunhas(arr)
                              }}
                            />
                            {testemunhas.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => removerTestemunha(idx)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {testemunhas.length < 4 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={adicionarTestemunha}
                          >
                            + Adicionar Testemunha
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Consultor Responsável (Anexo Único)</Label>
                    <Input
                      className="h-8 text-xs"
                      value={consultorResponsavel}
                      onChange={(e) => setConsultorResponsavel(e.target.value)}
                      placeholder="Flávio Moura"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 5: ANEXO ÚNICO                                                      */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Etapa 5: Anexo Único – Proposta Comercial
                </CardTitle>
                <CardDescription className="text-xs">
                  Versão final da proposta com ementas e tópicos detalhados (Parágrafo segundo da
                  Cláusula Terceira)
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nº Proposta</Label>
                    <Input
                      className="h-8 text-xs"
                      value={anexoPropostaNumero}
                      onChange={(e) => setAnexoPropostaNumero(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Proposta</Label>
                    <Input
                      className="h-8 text-xs"
                      value={anexoPropostaData}
                      onChange={(e) => setAnexoPropostaData(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Validade</Label>
                    <Input
                      className="h-8 text-xs"
                      value={anexoPropostaValidade}
                      onChange={(e) => setAnexoPropostaValidade(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">1. Programa Contratado *</Label>
                  <Input
                    className="h-8 text-xs font-semibold"
                    value={anexoProgramaNome}
                    onChange={(e) => setAnexoProgramaNome(e.target.value)}
                    placeholder="PROGRAMA DE DESENVOLVIMENTO DA LIDERANÇA"
                  />
                </div>

                {/* Ementas dos Módulos */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold">Ementas e Conteúdo Programático</Label>
                  {anexoModulos.map((mod, modIdx) => (
                    <div key={mod.id} className="p-3 border rounded-lg bg-card space-y-2">
                      <div className="flex justify-between items-center">
                        <Input
                          className="h-7 text-xs font-bold flex-1 mr-2"
                          value={mod.titulo}
                          onChange={(e) => {
                            const arr = [...anexoModulos]
                            arr[modIdx].titulo = e.target.value
                            setAnexoModulos(arr)
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px]"
                          onClick={() => adicionarTopicoEmenta(modIdx)}
                        >
                          + Tópico
                        </Button>
                      </div>

                      <div className="space-y-1">
                        {mod.topicos.map((top, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <Input
                              className="h-6 text-xs flex-1"
                              value={top}
                              onChange={(e) => {
                                const arr = [...anexoModulos]
                                arr[modIdx].topicos[tIdx] = e.target.value
                                setAnexoModulos(arr)
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const arr = [...anexoModulos]
                                arr[modIdx].topicos = arr[modIdx].topicos.filter(
                                  (_, i) => i !== tIdx,
                                )
                                setAnexoModulos(arr)
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ========================================================================= */}
          {/* ETAPA 6: EMISSÃO FINAL E DOWNLOADS                                        */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Etapa 6: Emissão Final & Download
                </CardTitle>
                <CardDescription className="text-xs">
                  Contrato pronto para geração em PDF A4 com trilha de auditoria e exportação Word
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-emerald-900">
                    Contrato Validado e Pronto para Emissão
                  </h4>
                  <p className="text-emerald-800">
                    O documento incorpora integralmente o texto verbatim do modelo, com Cláusula
                    Vigésima Primeira de Prevalência, tabela da Cláusula Segunda renderizada como
                    tabela real, Anexo Único em nova página e registro eletrônico de auditoria ao
                    final.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={handleBaixarPdf}
                    disabled={generatingPdf}
                    className="h-11 gap-2 bg-primary text-xs"
                  >
                    <Download className="w-4 h-4" />
                    {generatingPdf ? 'Gerando PDF A4...' : 'Baixar PDF Oficial (A4)'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleBaixarDocx}
                    className="h-11 gap-2 text-xs"
                  >
                    <Download className="w-4 h-4" /> Baixar DOCX (Word)
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleSalvarContratoBanco('emitido')}
                    disabled={savingContrato}
                    className="h-11 gap-2 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    {savingContrato ? 'Gravando...' : 'Gravar como Emitido'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Navegação do Wizard */}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={voltarEtapa}
              disabled={currentStep === 0}
              className="gap-1.5 text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>

            {currentStep < 6 ? (
              <Button size="sm" onClick={avancarEtapa} className="gap-1.5 text-xs">
                Avançar <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleBaixarPdf}
                disabled={generatingPdf}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Gerar PDF A4 <Download className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Pré-visualização do Contrato em Tempo Real */}
          <div className="pt-4">
            <ContratoPreview dados={dadosContratoConsolidados} />
          </div>
        </div>

        {/* Coluna da Direita: Motor de Cálculo / Painel de Simulação Lateral (4 colunas) */}
        <div className="lg:col-span-4 space-y-6 sticky top-4">
          <SimuladorEncargos modulos={modulos} />

          {/* Card Resumo do Contrato */}
          <Card className="border bg-card/90 text-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumo da Operação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contratada:</span>
                <span className="font-semibold">{contratadaEdit.nome || 'Trend Consultoria'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contratante:</span>
                <span className="font-semibold truncate max-w-[150px]">
                  {contratanteEdit.razao_social || 'A definir'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carga Horária Total:</span>
                <Badge variant="outline">{cargaHorariaTotal} horas</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investimento Total:</span>
                <span className="font-bold text-primary">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Módulos:</span>
                <span>{modulos.length} módulos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despesas Viagem:</span>
                <Badge variant="outline">
                  {despesasViagemAtivas ? 'Cláusula 7ª Ativa' : 'Suprimida'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para Cadastro Rápido de Cliente */}
      <QuickClientDialog
        open={quickClientOpen}
        onOpenChange={setQuickClientOpen}
        onCreated={async (novoCli, novoRep) => {
          setClientes((prev) => [novoCli, ...prev])
          setSelectedClienteId(novoCli.id)
          await atualizarDadosContratante(novoCli.id)
        }}
      />
    </div>
  )
}
