export interface ProductInfo {
  id: string
  name: string
  price: number
  timeline: string
  profile: string
  objective: string
  format?: string
  tierLevel: number // 1: abertura/entrada, 2: médio ticket/porta de entrada, 3: intermediário, 4: principal
}

export interface CommercialTableItem {
  c: string // Condição
  e: string // Estrutura de parcelamento / pagamento
  v: number // Valor à vista / base
  total?: string // Total calculado
  bonus?: string // Bônus e observações
  carta?: boolean
  fixed?: string
}

export interface PainItem {
  t: string
  d: string
}

export interface ObjectionItem {
  k: string
  t: string
  tr: string
}

// -----------------------------------------------------------------------------
// CATÁLOGO COMPLETO DE PRODUTOS (CONFORME PLAYBOOKS OFICIAIS DE OUTUBRO/2026)
// -----------------------------------------------------------------------------

export const PRODUCTS: Record<'neomaster' | 'neoprime', Record<string, ProductInfo>> = {
  neomaster: {
    teste: {
      id: 'teste',
      name: 'Teste de Prontidão da Gestão',
      price: 0,
      timeline: '15 a 20 min',
      profile: 'Produto de abertura para qualificação e diagnóstico inicial.',
      objective: 'Qualificar e diagnosticar a prontidão do empresário e da liderança.',
      format: 'Online gratuito',
      tierLevel: 1,
    },
    equipe: {
      id: 'equipe',
      name: 'Construindo uma Equipe Autogerenciável (16 aulas)',
      price: 497,
      timeline: '20 a 30 min',
      profile: 'Entrada no ecossistema; empresário buscando primeiras ferramentas práticas.',
      objective: 'Produto de entrada, formato gravado.',
      format: '16 aulas gravadas',
      tierLevel: 1,
    },
    protensora: {
      id: 'protensora',
      name: 'Programa Gestão Protensora',
      price: 1997,
      timeline: '25 a 35 min',
      profile: 'Aprofundamento técnico com suporte em grupo; quer aprender o método estruturado.',
      objective: 'Aprofundar método com aulas gravadas e encontros online em grupo.',
      format: 'Gravado + encontros em grupo online',
      tierLevel: 1,
    },
    diag: {
      id: 'diag',
      name: 'Diagnóstico Neomaster',
      price: 5000,
      timeline: '30 a 35 min',
      profile:
        'Porta de entrada. Cliente sem cultura de investimento em alto ticket, sem clareza das causas dos gargalos, sobrecarregado pela dor operacional.',
      objective:
        'Trazer clareza sobre a real situação da empresa, mapear prioridades e eliminar a gestão por intuição em 2 reuniões executivas.',
      format: '2 reuniões executivas (Coleta + Devolutiva) + FMEDU',
      tierLevel: 2,
    },
    start: {
      id: 'start',
      name: 'Neomaster Start',
      price: 20000,
      timeline: '45 a 50 min',
      profile:
        'Etapa intermediária. Reconhece o problema e a sobrecarga, mas demonstra desconfiança técnica ou receio de aportes maiores.',
      objective: 'Ações práticas de curto prazo para alinhar a operação aos trilhos da eficiência.',
      format: '3 a 5 mentorias individuais + 3 em grupo + Trilha FMEDU',
      tierLevel: 3,
    },
    executive: {
      id: 'executive',
      name: 'Neomaster Executive Club',
      price: 45000,
      timeline: '1h00 a 1h10',
      profile:
        'Programa principal de transformação integral. Empresário maduro que busca se desvencilhar da operação cotidiana.',
      objective:
        'Transformação estrutural completa em 12 meses via governança, processos, autonomia gerencial e previsibilidade.',
      format: '12 mentorias 1:1 anuais + 12 encontros em grupo + Imersão presencial + FMEDU',
      tierLevel: 4,
    },
  },
  neoprime: {
    diag: {
      id: 'diag',
      name: 'Diagnóstico Neoprime',
      price: 5000,
      timeline: '30 a 35 min',
      profile:
        'Porta de entrada. Fundador sem cultura de contratar serviços de alto ticket, sem clareza dos reais problemas, mas que sente as dores de que as coisas não funcionam corretamente.',
      objective:
        'Dar clareza ao empresário sobre a real situação e onde ele deveria dedicar mais atenção em 2 reuniões executivas.',
      format: '2 reuniões executivas (Coleta + Devolutiva) + FMEDU',
      tierLevel: 2,
    },
    start: {
      id: 'start',
      name: 'Neoprime Start',
      price: 20000,
      timeline: '45 a 50 min',
      profile:
        'Etapa intermediária. Fundador que reconhece os medos, mas não está disposto a investir muito e tem muita desconfiança.',
      objective:
        'Promover ações de curto prazo para colocar o negócio no trilho, apresentando um caminho a ser seguido.',
      format: '3 a 5 mentorias individuais + 3 em grupo + Trilha FMEDU',
      tierLevel: 3,
    },
    mentoria: {
      id: 'mentoria',
      name: 'Mentoria Neoprime Sucessão Familiar',
      price: 45000,
      timeline: '1h00 a 1h10',
      profile:
        'Programa principal de transformação integral. Fundadores e sucessores com alta prontidão emocional e liquidez.',
      objective:
        'Blindar família e patrimônio, estruturar governança e processo sucessório executivo.',
      format: '12 mentorias 1:1 + Assessment sucessores + Plano sucessão + Governança + FMEDU',
      tierLevel: 4,
    },
  },
}

// -----------------------------------------------------------------------------
// TABELAS COMERCIAIS VERBATIM DA PARTE III DOS PLAYBOOKS
// -----------------------------------------------------------------------------

export const TABLES: Record<string, CommercialTableItem[]> = {
  // NEOMASTER — TESTE DE PRONTIDÃO
  teste: [
    {
      c: 'Preço à vista',
      e: 'Gratuito',
      v: 0,
      total: 'R$ 0,00',
      bonus: 'Produto gratuito de qualificação e diagnóstico inicial',
    },
    {
      c: 'Valor Protagonista',
      e: 'Gratuito',
      v: 0,
      total: 'R$ 0,00',
      bonus: 'Acesso ao questionário e devolutiva de prontidão',
    },
    {
      c: 'Última Condição',
      e: 'Gratuito',
      v: 0,
      total: 'R$ 0,00',
      bonus: 'Sem custo de entrada para triagem qualificada',
    },
  ],

  // NEOMASTER — CONSTRUINDO UMA EQUIPE AUTOGERENCIÁVEL
  equipe: [
    {
      c: 'À vista',
      e: 'Pagamento único via Pix ou Cartão',
      v: 497,
      total: 'R$ 497,00',
      bonus: 'Acesso imediato às 16 aulas gravadas da metodologia',
    },
    {
      c: 'Parcelado',
      e: '12x de R$ 45,50',
      v: 497,
      total: 'R$ 546,00',
      bonus: 'Parcelamento em até 12x no cartão de crédito',
    },
  ],

  // NEOMASTER — PROGRAMA GESTÃO PROTENSORA
  protensora: [
    {
      c: 'À vista',
      e: 'Pagamento único via Pix ou Cartão',
      v: 1997,
      total: 'R$ 1.997,00',
      bonus: 'Bônus: encontros em grupo online e aulas gravadas completas',
    },
    {
      c: 'Parcelado',
      e: '12x de R$ 186,00',
      v: 1997,
      total: 'R$ 2.232,00',
      bonus: 'Bônus: encontros em grupo online e aulas gravadas completas',
    },
  ],

  // DIAGNÓSTICO (AMBAS AS LINHAS — NEOMASTER E NEOPRIME)
  diag: [
    {
      c: 'Preço Tabela',
      e: '6x de R$ 935,00',
      v: 5000,
      total: 'R$ 5.610,00',
      bonus:
        'Diagnóstico individual completo com devolutiva estruturada em 2 reuniões executivas + acesso à plataforma FMEDU',
    },
    {
      c: 'Valor Protagonista',
      e: '12x de R$ 466,65',
      v: 4500,
      total: 'R$ 5.599,80',
      bonus: '2 reuniões executivas (Coleta + Devolutiva) + acesso à plataforma FMEDU',
    },
    {
      c: 'Última Condição',
      e: 'Entrada R$ 2.500,00 + 2x de R$ 1.000,00',
      v: 4500,
      total: 'R$ 4.500,00',
      bonus: 'Entrada facilitada com parcelamento direto e acesso FMEDU',
    },
  ],

  // START (AMBAS AS LINHAS — NEOMASTER E NEOPRIME)
  start: [
    {
      c: 'Preço Tabela',
      e: '6x de R$ 3.650,00',
      v: 20000,
      total: 'R$ 21.900,00',
      bonus: '3 mentorias individuais + 3 mentorias online em grupo + Trilha FMEDU',
    },
    {
      c: 'Valor Protagonista',
      e: '6x de R$ 3.300,00',
      v: 18000,
      total: 'R$ 19.800,00',
      bonus: '4 mentorias individuais (+1 mentoria bônus) + 3 mentorias em grupo + Trilha FMEDU',
    },
    {
      c: 'Última Condição',
      e: '2x de R$ 9.000,00',
      v: 18000,
      total: 'R$ 18.000,00',
      bonus: '5 mentorias individuais (+2 mentorias bônus) + 3 mentorias em grupo + Trilha FMEDU',
    },
  ],

  // NEOMASTER — EXECUTIVE CLUB
  executive: [
    {
      c: 'Preço Tabela',
      e: '12x de R$ 4.125,00',
      v: 45000,
      total: 'R$ 49.500,00',
      bonus: '12 sessões 1:1 + 12 encontros grupo + Imersão 2 ingressos + FMEDU + Grupo WhatsApp',
    },
    {
      c: 'Valor Protagonista',
      e: '6x de R$ 7.700,00',
      v: 40000,
      total: 'R$ 46.200,00',
      bonus:
        'Adesão imediata: 12 sessões 1:1, 12 encontros em grupo, Imersão (2 ingressos), Swipe file, livro físico',
    },
    {
      c: 'Última Condição',
      e: 'Entrada R$ 20.000,00 + 12x de R$ 1.830,00',
      v: 41900,
      total: 'R$ 41.960,00',
      bonus: 'Entrada reduzida com parcelamento estendido e todos os bônus do programa anual',
    },
    {
      c: 'Carta na Manga (Opção A)',
      e: 'Entrada R$ 15.000,00 + 6x de R$ 5.534,00',
      v: 0,
      total: 'R$ 48.204,00',
      carta: true,
      fixed: 'Entrada R$ 15.000 + 6x R$ 5.534',
      bonus:
        'Uso sob autorização da diretoria: estritamente para restrição transitória de liquidez sem desvalorizar o ticket',
    },
    {
      c: 'Carta na Manga (Opção B)',
      e: 'Entrada R$ 10.000,00 + 10x de R$ 4.098,00',
      v: 0,
      total: 'R$ 50.980,00',
      carta: true,
      fixed: 'Entrada R$ 10.000 + 10x R$ 4.098',
      bonus:
        'Uso sob autorização da diretoria: estritamente para restrição transitória de liquidez sem desvalorizar o ticket',
    },
  ],

  // NEOPRIME — MENTORIA SUCESSÃO FAMILIAR
  mentoria: [
    {
      c: 'Preço Tabela',
      e: '12x de R$ 4.125,00',
      v: 45000,
      total: 'R$ 49.500,00',
      bonus:
        '12 sessões 1:1 + Assessment sucessores + Diagnóstico governança + Plano de ação + FMEDU',
    },
    {
      c: 'Valor Protagonista',
      e: '6x de R$ 7.700,00',
      v: 42000,
      total: 'R$ 46.200,00',
      bonus:
        'Adesão imediata: 12 sessões 1:1 fundadores/sucessores, Assessment, Governança, Matriz de papéis, livro físico',
    },
    {
      c: 'Última Condição',
      e: 'Entrada R$ 20.000,00 + 12x de R$ 1.830,00',
      v: 41900,
      total: 'R$ 41.960,00',
      bonus: 'Entrada reduzida com parcelamento estendido e blindagem patrimonial integral',
    },
    {
      c: 'Carta na Manga (Opção A)',
      e: 'Entrada R$ 15.000,00 + 6x de R$ 5.534,00',
      v: 0,
      total: 'R$ 48.204,00',
      carta: true,
      fixed: 'Entrada R$ 15.000 + 6x R$ 5.534',
      bonus:
        'Uso sob autorização da diretoria: estritamente para restrição transitória de liquidez sem desvalorizar o ticket',
    },
    {
      c: 'Carta na Manga (Opção B)',
      e: 'Entrada R$ 10.000,00 + 10x de R$ 4.098,00',
      v: 0,
      total: 'R$ 50.980,00',
      carta: true,
      fixed: 'Entrada R$ 10.000 + 10x R$ 4.098',
      bonus:
        'Uso sob autorização da diretoria: estritamente para restrição transitória de liquidez sem desvalorizar o ticket',
    },
  ],
}

// -----------------------------------------------------------------------------
// ENTREGÁVEIS DETALHADOS CONFORME PARTE IV DOS PLAYBOOKS
// -----------------------------------------------------------------------------

export const DELIVERABLES: Record<string, string[]> = {
  teste: [
    'Questionário de prontidão executiva e maturidade da gestão',
    'Raio-x preliminar da dependência do dono',
    'Devolutiva com classificação do estágio atual',
    'Direcionamento consciente para o próximo passo da esteira',
  ],
  equipe: [
    '16 aulas gravadas práticas e direto ao ponto',
    'Roteiro de estruturação de liderança e delegação',
    'Templates de alinhamento operacional e rotinas',
    'Acesso à plataforma FMEDU',
  ],
  protensora: [
    'Treinamentos completos do método Gestão Protensora',
    'Encontros em grupo online com suporte e tira-dúvidas',
    'Aulas gravadas com acesso contínuo',
    'Kits de ferramentas práticas e templates de gestão',
  ],
  diag: [
    'Sessão 1 — Coleta e Imersão: mapeamento integral de processos, pessoas, liderança e indicadores do negócio',
    'Sessão 2 — Devolutiva e Mapa de Prioridades: apresentação do raio-x completo e do plano de ação para execução imediata',
    'Acesso à plataforma FMEDU com treinamentos online contínuos',
    'Momento natural para avanço consciente rumo ao Start ou ao programa principal',
  ],
  start: [
    '3 mentorias individuais focadas na dor principal (4 ou 5 conforme condição Protagonista ou Última Condição)',
    '3 mentorias em grupo online para troca com outros empresários do mesmo nível',
    'Trilha de desenvolvimento prático na plataforma FMEDU',
    'Intervenção rápida de curto prazo (60 dias) para alinhar a operação aos trilhos',
  ],
  executive: [
    '12 sessões anuais de mentoria individual 1:1 com Flávio Moura',
    '12 encontros mensais em grupo para networking e inteligência coletiva',
    'Imersão presencial executiva com 2 ingressos',
    'Acesso à plataforma FMEDU e à comunidade Neomaster (grupo de WhatsApp)',
    'Grupo individual no WhatsApp dedicado para cada negócio',
    'Swipe file ilimitado (processos validados, dashboards e ferramentas)',
    'Condições especiais para contratação de outros serviços complementares',
    'Livro físico Gestão Protensora',
  ],
  mentoria: [
    'Diagnóstico Completo de Governança Familiar e Corporativa (relações societárias, riscos patrimoniais)',
    'Assessment Individual dos Sucessores (avaliação comportamental e técnica de cada herdeiro)',
    'Plano de Ação e Estruturação da Sucessão Executiva (transição gradual de autoridade e tomada de decisão)',
    'Matriz de Papéis e Responsabilidades (escopos formais, metas e conselho consultivo)',
    'Acompanhamento Individual 1:1 com 12 sessões de mentoria anual (fundador e sucessores)',
    'Trilha de Desenvolvimento na FMEDU e comunidade de líderes Neoprime',
    'Swipe file ilimitado de gestão empresarial e governança',
    'Livro físico Sucessão Familiar',
  ],
}

// -----------------------------------------------------------------------------
// MATRIZ DE TIMING OFICIAL CONFORME PARTE V DOS PLAYBOOKS
// -----------------------------------------------------------------------------

export const TIMINGS: Record<string, [string, number][]> = {
  teste: [
    ['Introdução e qualificação inicial', 4],
    ['Questionário de prontidão', 8],
    ['Diagnóstico e leitura dos gargalos', 5],
    ['Encaminhamento para a esteira', 3],
  ],
  equipe: [
    ['Introdução pragmática', 4],
    ['Mapeamento da sobrecarga da equipe', 8],
    ['Apresentação do curso e 16 aulas', 8],
    ['Fechamento e acesso imediato', 5],
  ],
  protensora: [
    ['Introdução e contexto', 5],
    ['Diagnóstico da carência metodológica', 10],
    ['Apresentação do método e encontros', 10],
    ['Fechamento e inscrição', 5],
  ],
  diag: [
    ['Introdução (rapport e contextualização rápida)', 4],
    ['Questionário focal (sintomas, sobrecarga e centralização)', 11],
    ['Pitch radiografia (raio-x em 2 sessões e mapa de riscos)', 10],
    ['Ancoragem (risco de decidir no escuro)', 2],
    ['Fechamento (condição e agendamento da sessão)', 6],
  ],
  start: [
    ['Introdução (rapport com perfil cauteloso/desconfiado)', 5],
    ['Questionário enxuto (riscos operacionais imediatos)', 15],
    ['Pitch direto (3 individuais + 3 em grupo + FMEDU)', 15],
    ['Ancoragem (custo da inércia)', 2],
    ['Fechamento (condição e data da primeira mentoria)', 11],
  ],
  executive: [
    ['Introdução (quebra-gelo, rapport e contextualização)', 5],
    ['Questionário SPIN (operação, gargalos e gap emocional/financeiro)', 20],
    ['Pitch de vendas (pilares, contextualização, mandala e entregáveis)', 20],
    ['Ancoragem de valor (metáfora do imóvel)', 2],
    ['Fechamento comercial (tabela de condições e formalização)', 18],
  ],
  mentoria: [
    ['Introdução e rapport (história, marketing pessoal e pacto)', 5],
    ['Questionário SPIN (quatro medos, patrimônio e gap emocional)', 20],
    ['Pitch estruturado (mercado, mandala de entregáveis e cases)', 20],
    ['Ancoragem de valor (metáfora do imóvel)', 2],
    ['Fechamento comercial (tabela, dúvidas e formalização)', 18],
  ],
}

// -----------------------------------------------------------------------------
// DORES DO CLIENTE CONFORME OS PLAYBOOKS
// -----------------------------------------------------------------------------

export const PAIN_NEO: PainItem[] = [
  {
    t: 'Dependência do dono',
    d: 'Todas as decisões e a operação passam pelo empresário, travando a expansão e roubando a liberdade.',
  },
  {
    t: 'Despreparo dos gestores',
    d: 'Lideranças operam sem ferramentas nem autonomia para decidir sem recorrer constantemente ao dono.',
  },
  {
    t: 'Conhecimento na cabeça das pessoas',
    d: 'O saber crítico está retido em funcionários-chave, não em processos documentados e replicáveis.',
  },
  {
    t: 'Custo da inércia operacional',
    d: 'Cada mês adiando a profissionalização consome dezenas de milhares de reais em retrabalho, caixa e desgaste emocional.',
  },
]

export const PAIN_PRIME: PainItem[] = [
  {
    t: 'Medo financeiro',
    d: 'Risco de diluição ou perda do patrimônio acumulado ao longo de décadas por decisões impulsivas da nova geração.',
  },
  {
    t: 'Medo da inexperiência da nova geração',
    d: 'Sucessores sem maturidade técnica e emocional para assumir a governança sem desestabilizar a operação.',
  },
  {
    t: 'Medo de conflito familiar',
    d: 'Disputas societárias e desentendimentos entre herdeiros quando não há acordos e limites de atuação pré-definidos.',
  },
  {
    t: 'Medo de perder relevância e identidade',
    d: 'O fundador receia ser excluído do negócio que construiu do zero, sem uma transição planejada e respeitosa.',
  },
  {
    t: 'Argumento central da inércia sucessória',
    d: 'Enquanto a governança é postergada, os filhos já tomam decisões de vida, definem outras carreiras ou consolidam vícios que custarão milhões no futuro.',
  },
]

// -----------------------------------------------------------------------------
// TRATAMENTO DAS 10 OBJEÇÕES OFICIAIS (PARTE VII DOS PLAYBOOKS)
// -----------------------------------------------------------------------------

export const OBJECTIONS: ObjectionItem[] = [
  {
    k: 'caro',
    t: 'Está caro',
    tr: 'Entendo, e agradeço a sinceridade. Caro é relativo: caro é também continuar decidindo sem clareza. Antes de olhar o preço, me ajuda a entender: quanto já custou para você o problema que queremos resolver?',
  },
  {
    k: 'pensar',
    t: 'Preciso pensar',
    tr: 'Claro, decidir com calma é importante. Só me ajuda a entender: o que exatamente está pendente para essa decisão, alguma dúvida sobre a entrega ou sobre o investimento?',
  },
  {
    k: 'socio',
    t: 'Preciso falar com meu sócio ou cônjuge',
    tr: 'Faz todo sentido, decisão de patrimônio se toma em conjunto. Quer que eu prepare um resumo objetivo para essa conversa e, se fizer sentido, entramos os três numa chamada rápida?',
  },
  {
    k: 'momento',
    t: 'Agora não é o momento',
    tr: 'Respeito o seu momento. Só percebo que o problema que você descreveu não vai esperar o momento ideal. O que precisaria mudar para o momento virar este mês?',
  },
  {
    k: 'consultoria',
    t: 'Já tentei consultoria e não funcionou',
    tr: 'Sinto muito que tenha sido assim, e isso é mais comum do que parece. A diferença aqui é método e acompanhamento contínuo, não um relatório e adeus. O que faltou na experiência anterior que você gostaria de ver garantida agora?',
  },
  {
    k: 'tempo',
    t: 'Não tenho tempo',
    tr: 'Justamente por isso existe este trabalho: para devolver tempo a você. A estrutura pede pouco do seu dia. Entre as rotinas que você faz hoje, qual delas você mais gostaria de tirar da sua mesa?',
  },
  {
    k: 'email',
    t: 'Me manda uma proposta por e-mail',
    tr: 'Envio com prazer, mas antes prefiro garantir que a proposta faça sentido de verdade. Posso te fazer duas perguntas rápidas para calibrar o escopo e te mandar algo certeiro?',
  },
  {
    k: 'sozinho',
    t: 'Vou fazer sozinho',
    tr: 'Admiro essa determinação, e muita coisa você já resolveu assim. Mas o que você descreveu exige olhar de fora e método. O que já tentou internamente até hoje?',
  },
  {
    k: 'longo',
    t: 'Programa muito longo',
    tr: 'A duração existe porque transformação estrutural leva tempo, mas os primeiros resultados aparecem cedo. Prefere que a gente comece por uma etapa mais curta, como o Start ou o Diagnóstico?',
  },
  {
    k: 'conhece',
    t: 'Não conheço você',
    tr: 'Justo. Trabalho há mais de 18 anos com desenvolvimento de empresas e líderes, sou autor de livros de gestão e atuo em conselhos. Quer que eu te mande alguns cases de quem já passou pelo programa?',
  },
]

// -----------------------------------------------------------------------------
// INTERFACE DE DADOS DO FORMULÁRIO DE REUNIÃO
// -----------------------------------------------------------------------------

export interface MeetingFormData {
  // Etapa 1
  leadName: string
  company: string
  segment: string
  employees: string
  tenure: string
  channel: string
  interest: 'neomaster' | 'neoprime' | 'indefinida' | ''
  participants: string
  decisor: 'sim' | 'nao' | ''

  // Etapa 2
  revenue: 'ate1' | '1a5' | '5a20' | '20a50' | 'acima50' | ''
  urgency: 'baixo' | 'medio' | 'alto' | 'critico' | ''
  history: 'funcionou' | 'nao_funcionou' | 'nunca' | ''
  liquidity: 'confortavel' | 'apertada' | 'sem' | ''
  readiness: 'aberto' | 'reconhece' | 'cetico' | 'vitimista' | ''

  dorPrincipal: string
  sonoFuturo: string
  horasOperacao: string
  sair15Dias: string
  saidaGestor: string
  custoRotatividade: string
  cenario12Meses: string

  // Etapa 4
  compromissos: string
  numerosCitados: string
  termosCliente: string
  indicacoes: string
  proximoPasso: string
  dataProximoContato: string

  // Etapa 5
  resultado: string
  condicaoEscolhida: string
  formaPagamento: string
}

export const INITIAL_FORM_DATA: MeetingFormData = {
  leadName: '',
  company: '',
  segment: '',
  employees: '',
  tenure: '',
  channel: '',
  interest: '',
  participants: '',
  decisor: '',

  revenue: '',
  urgency: '',
  history: '',
  liquidity: '',
  readiness: '',

  dorPrincipal: '',
  sonoFuturo: '',
  horasOperacao: '',
  sair15Dias: '',
  saidaGestor: '',
  custoRotatividade: '',
  cenario12Meses: '',

  compromissos: '',
  numerosCitados: '',
  termosCliente: '',
  indicacoes: '',
  proximoPasso: '',
  dataProximoContato: '',

  resultado: '',
  condicaoEscolhida: '',
  formaPagamento: '',
}

export interface RecommendationTier {
  line: 'neomaster' | 'neoprime' | 'indefinida'
  key: string // teste | equipe | protensora | diag | start | executive | mentoria
  reason: string
}

// -----------------------------------------------------------------------------
// MOTOR DE RECOMENDAÇÃO (REGRA DE CONDUÇÃO OFICIAL ITEM 1.4 DOS PLAYBOOKS)
// -----------------------------------------------------------------------------
/**
 * REGRA OFICIAL DOS PLAYBOOKS (Item 1.4):
 * "O closer qualifica a prontidão emocional e financeira no questionário inicial.
 * Nunca forçar o programa principal em perfis céticos ou sem liquidez: nesses casos,
 * aplicar downsell consciente para o Start ou o Diagnóstico.
 * A devolutiva do Diagnóstico é o momento natural de upsell para o Start ou o programa principal;
 * a conclusão do Start conduz ao ciclo anual do programa completo."
 *
 * REGRAS DE DECISÃO DA ESTEIRA:
 * 1. Linha indefinida ou sem dados de qualificação mínimos:
 *    -> Diagnóstico (porta de entrada segura de R$ 5.000). NUNCA Start!
 *
 * 2. Sem liquidez severa / perfil de abertura (lead sem liquidez + faturamento inicial até R$ 1M):
 *    - Se receita 'ate1' e liquidez 'sem':
 *      * Na Neomaster: Teste de Prontidão da Gestão (R$ 0) ou Equipe Autogerenciável (R$ 497)
 *      * Na Neoprime: Diagnóstico Neoprime (R$ 5.000) com última condição facilitada
 *    - Se liquidez 'sem' mas receita intermediária, ou perfil cético/sem liquidez:
 *      * Diagnóstico (R$ 5.000) — porta de entrada oficial dos playbooks para cliente sem cultura de alto ticket
 *
 * 3. Prontidão cética ou sem cultura de investimento em alto ticket:
 *    -> Diagnóstico (R$ 5.000)
 *
 * 4. Prontidão intermediária ("reconhece o problema mas desconfia" OU liquidez "apertada"):
 *    -> Start (R$ 20.000) — etapa intermediária de intervenção rápida (3 a 5 mentorias)
 *
 * 5. Prontidão alta ("aberto e ciente do problema") E liquidez "confortavel":
 *    - Neomaster: Neomaster Executive Club (R$ 45.000)
 *    - Neoprime: Mentoria Neoprime Sucessão Familiar (R$ 45.000)
 *
 * 6. Perfil vitimista:
 *    -> Diagnóstico (R$ 5.000) para choque de realidade com raio-x técnico e devolutiva em 2 sessões.
 *
 * 7. Fallback quando dados não preenchidos ou incompletos:
 *    -> SEMPRE Diagnóstico (R$ 5.000), NUNCA Start (R$ 20.000)!
 */
export function determineTier(data: MeetingFormData): RecommendationTier {
  const line = data.interest
  const liq = data.liquidity
  const rd = data.readiness
  const rev = data.revenue
  const urg = data.urgency
  const hasLine = line && line !== 'indefinida'

  // Linha indefinida
  if (!hasLine) {
    return {
      line: 'indefinida',
      key: 'diag',
      reason:
        'A linha de interesse ainda não está definida. O Diagnóstico é a porta de entrada segura (R$ 5.000); defina a linha (Neomaster ou Neoprime) para calibrar a esteira completa.',
    }
  }

  // Caso 1: Extrema restrição de liquidez e porte de entrada (específico da linha Neomaster)
  if (line === 'neomaster' && liq === 'sem' && rev === 'ate1') {
    if (rd === 'cetico' || rd === 'vitimista' || !urg || urg === 'baixo') {
      return {
        line: 'neomaster',
        key: 'teste',
        reason:
          'Porte inicial (faturamento até R$ 1M) e sem liquidez imediata. Teste de Prontidão da Gestão (gratuito) para qualificação e diagnóstico de abertura sem barreira financeira.',
      }
    }
    return {
      line: 'neomaster',
      key: 'equipe',
      reason:
        'Sem liquidez para alto ticket e faturamento até R$ 1M. Curso Construindo uma Equipe Autogerenciável (R$ 497 ou 12x R$ 45,50) para entrada rápida e prática no ecossistema.',
    }
  }

  // Caso 2: Pequeno porte com urgência moderada/baixa ou ticket de aprofundamento de entrada
  if (
    line === 'neomaster' &&
    liq === 'apertada' &&
    rev === 'ate1' &&
    (rd === 'cetico' || rd === 'vitimista')
  ) {
    return {
      line: 'neomaster',
      key: 'protensora',
      reason:
        'Porte inicial com liquidez reduzida e perfil cauteloso. Programa Gestão Protensora (R$ 1.997 ou 12x R$ 186,00) para aprofundamento técnico em formato gravado com suporte em grupo.',
    }
  }

  // Caso 3: Perfil cético OU sem liquidez -> Diagnóstico (Regra 1.4: downsell consciente)
  if (rd === 'cetico' || liq === 'sem') {
    return {
      line,
      key: 'diag',
      reason:
        'Perfil cético ou sem liquidez imediata para aportes maiores. Conforme a regra de condução do Playbook (item 1.4), nunca forçar o programa principal: aplicar Diagnóstico (R$ 5.000), preparando o terreno para upsell natural na devolutiva.',
    }
  }

  // Caso 4: Perfil vitimista (sem clareza dos próprios gargalos operacionais)
  if (rd === 'vitimista') {
    return {
      line,
      key: 'diag',
      reason:
        'Perfil vitimista sem clareza da causa-raiz dos gargalos. Diagnóstico (R$ 5.000) em 2 reuniões executivas para trazer clareza matemática e eliminar a gestão por intuição antes de aportes maiores.',
    }
  }

  // Caso 5: Reconhece o problema mas desconfia OU liquidez apertada -> Start (Etapa intermediária)
  if (rd === 'reconhece' || liq === 'apertada') {
    return {
      line,
      key: 'start',
      reason:
        'Reconhece a dor e a sobrecarga, mas demonstra cautela técnica ou liquidez apertada. Start (R$ 20.000) como intervenção de curto prazo (3 a 5 mentorias), cuja conclusão conduz naturalmente ao ciclo anual.',
    }
  }

  // Caso 6: Prontidão alta ("aberto") E liquidez confortável E faturamento consistente -> Programa Principal
  if (rd === 'aberto' && liq === 'confortavel') {
    if (line === 'neoprime') {
      return {
        line: 'neoprime',
        key: 'mentoria',
        reason:
          'Linha Neoprime com alta prontidão emocional e liquidez confortável. Mentoria Neoprime Sucessão Familiar (R$ 45.000) como programa principal de blindagem patrimonial, governança e sucessão executiva.',
      }
    }
    return {
      line: 'neomaster',
      key: 'executive',
      reason:
        'Linha Neomaster com alta prontidão emocional e liquidez confortável. Neomaster Executive Club (R$ 45.000) como programa principal de transformação integral de 12 meses para se desvencilhar da operação.',
    }
  }

  // Caso 7: Fallback padrão quando os dados de qualificação ainda são insuficientes ou intermediários
  // IMPORTANTE: O fallback padrão da esteira é o Diagnóstico (porta de entrada R$ 5.000), JAMAIS o Start (R$ 20.000)!
  return {
    line,
    key: 'diag',
    reason:
      'Porta de entrada padrão dos Playbooks. Diagnóstico (R$ 5.000) para trazer clareza sobre os reais gargalos em 2 reuniões executivas e qualificar para os próximos passos.',
  }
}

// -----------------------------------------------------------------------------
// DORES CALCULADAS COM BASE NAS RESPOSTAS DO QUESTIONÁRIO
// -----------------------------------------------------------------------------

export function computePains(tier: RecommendationTier, data: MeetingFormData): PainItem[] {
  const list = tier.line === 'neoprime' ? PAIN_PRIME.slice() : PAIN_NEO.slice()
  const allText = [
    data.dorPrincipal,
    data.sonoFuturo,
    data.horasOperacao,
    data.sair15Dias,
    data.saidaGestor,
    data.custoRotatividade,
    data.cenario12Meses,
  ]
    .join(' ')
    .toLowerCase()

  const out: PainItem[] = []

  if (tier.line === 'neoprime') {
    if (/patrim|dinheiro|caixa|investi|perder/.test(allText)) out.push(list[0])
    if (/filh|geração|sucessor|neto|jovem|inexperiên/.test(allText)) out.push(list[1])
    if (/conflit|irm|briga|família|familia|disputa/.test(allText)) out.push(list[2])
    if (/relevân|identidade|lugar|respeito|sair/.test(allText)) out.push(list[3])
    if (/sucess|12 meses|nada mudar|patrimônio|patrim|legado/.test(allText) || out.length < 2) {
      out.push(list[4])
    }
  } else {
    if (/dono|operação|operacional|horas|sair|ausên|sobrecarga|rotina/.test(allText))
      out.push(list[0])
    if (/gestor|líder|liderança|demiss|pedir|cobrança|despreparo/.test(allText)) out.push(list[1])
    if (/cabeça|conhecimento|processo|pessoas|centraliz/.test(allText)) out.push(list[2])
    if (/custou|custo|caixa|rotatividade|tempo|desgaste|12 meses|inércia/.test(allText))
      out.push(list[3])
  }

  if (out.length === 0) return list.slice(0, 2)

  const seen: Record<string, boolean> = {}
  return out.filter((p) => {
    if (seen[p.t]) return false
    seen[p.t] = true
    return true
  })
}

// -----------------------------------------------------------------------------
// OBJEÇÕES DETECTADAS
// -----------------------------------------------------------------------------

export function computeObjections(data: MeetingFormData): ObjectionItem[] {
  const hist = data.history
  const rd = data.readiness
  const out: string[] = []

  if (hist === 'nao_funcionou' || hist === 'funcionou') out.push('consultoria')
  if (rd === 'cetico') out.push('conhece')
  if (rd === 'reconhece' || rd === 'cetico') out.push('caro')
  if (data.liquidity === 'sem' || data.liquidity === 'apertada') out.push('momento')
  if (rd === 'reconhece') out.push('pensar')
  out.push('socio')
  out.push('tempo')
  out.push('email')
  out.push('sozinho')
  out.push('longo')

  const seen: Record<string, boolean> = {}
  const res = out.filter((k) => {
    if (seen[k]) return false
    seen[k] = true
    return true
  })

  return res.map((k) => OBJECTIONS.find((o) => o.k === k)).filter(Boolean) as ObjectionItem[]
}

// -----------------------------------------------------------------------------
// DETALHES DO PRODUTO RECOMENDADO COM ÂNCORAS DISTINTAS POR PRODUTO
// -----------------------------------------------------------------------------

export function getProductDetails(tier: RecommendationTier): {
  product: ProductInfo
  productName: string
  price: number
  tableKey: string
  anchorText: string
} {
  const prodMap = PRODUCTS[tier.line === 'neoprime' ? 'neoprime' : 'neomaster']
  const product = prodMap[tier.key] || prodMap.diag || PRODUCTS.neomaster.diag
  const tableKey = tier.key
  const productName = tier.line === 'indefinida' ? 'Diagnóstico (linha indefinida)' : product.name
  const price = product.price

  // Âncoras específicas conforme Playbooks oficiais:
  // - Executive Club e Sucessão Familiar: metáfora do imóvel (R$ 90.000+ / R$ 150.000+)
  // - Start: custo da inércia
  // - Diagnóstico: risco de decidir no escuro (raio-x em 2 reuniões)
  // - Teste / Cursos de entrada: custo do erro operacional ou primeiro passo sem barreira
  let anchorText = ''

  if (tier.key === 'mentoria') {
    anchorText =
      'Antes de abrirmos a tabela, imagine um imóvel de altíssimo padrão avaliado em R$ 1.000.000 vendido com urgência por R$ 600.000. O valor intrínseco continua sendo R$ 1.000.000. Somando 12 mentorias individuais com fundadores e sucessores, assessment completo dos herdeiros, diagnóstico de governança e proteção patrimonial de milhões de reais, a Mentoria Neoprime entrega um valor acumulado superior a R$ 150.000,00 no mercado tradicional.'
  } else if (tier.key === 'executive') {
    anchorText =
      'Imagine um imóvel comercial de altíssimo padrão avaliado em R$ 1.000.000 fechado por oportunidade a R$ 400.000. O valor de mercado percebido continua sendo de um milhão. Se somássemos individualmente as 12 mentorias 1:1, imersões presenciais com ingressos para a equipe, FMEDU, swipe file e suporte diário, estaríamos falando com tranquilidade de um investimento superior a R$ 90.000,00 no mercado tradicional.'
  } else if (tier.key === 'start') {
    anchorText =
      'Manter a sua empresa girando no escuro por mais 3 meses custa muito mais caro do que qualquer investimento em consultoria. Um único erro de contratação ou decisão equivocada da liderança já consome dezenas de milhares de reais. O Start é a intervenção de curto prazo calculada para estancar o desperdício imediatamente.'
  } else if (tier.key === 'diag') {
    anchorText =
      'Tomar decisões estruturais sem um raio-x completo é como um médico indicar cirurgia cardíaca sem exame prévio. O custo de continuar tomando decisões no "achismo" é o maior destruidor de margem no Brasil. Uma análise diagnóstica avulsa sênior custa mais de R$ 15.000 no mercado; o Diagnóstico é a porta de entrada com valor irrisório para eliminar as dúvidas e assumir o controle definitivo.'
  } else if (tier.key === 'protensora') {
    anchorText =
      'O Programa Gestão Protensora oferece o método completo e comprovado para empresários e líderes estruturarem processos e autonomia com suporte em grupo, a uma fração do custo de uma consultoria individual.'
  } else if (tier.key === 'equipe') {
    anchorText =
      'Por menos de R$ 1,50 por dia (12x de R$ 45,50), você tem acesso imediato a 16 aulas gravadas com a metodologia prática de construção de equipes autogerenciáveis, capacitando suas lideranças a resolver rotinas sem depender de você.'
  } else {
    anchorText =
      'O Teste de Prontidão da Gestão é o diagnóstico inicial gratuito do Grupo Flávio Moura para mapear o nível de dependência do negócio e qualificar a prontidão da liderança.'
  }

  return { product, productName, price, tableKey, anchorText }
}

// -----------------------------------------------------------------------------
// CALCULAR PORCENTAGEM DE QUALIFICAÇÃO
// -----------------------------------------------------------------------------

export function calculateQualificationPercentage(data: MeetingFormData): number {
  const fields = [
    !!data.leadName,
    !!data.company,
    !!data.segment,
    !!data.employees,
    !!data.tenure,
    !!data.channel,
    !!data.interest,
    !!data.participants,
    !!data.decisor,
    !!data.revenue,
    !!data.urgency,
    !!data.history,
    !!data.liquidity,
    !!data.readiness,
    !!data.dorPrincipal,
  ]
  const count = fields.filter(Boolean).length
  return Math.round((count / fields.length) * 100)
}

// -----------------------------------------------------------------------------
// MONTAR RESUMO EXECUTIVO DA REUNIÃO
// -----------------------------------------------------------------------------

export function buildMeetingSummary(
  data: MeetingFormData,
  tier: RecommendationTier,
  formatBRL: (v: number) => string,
): string {
  const { product } = getProductDetails(tier)
  const pains =
    computePains(tier, data)
      .map((p) => `- ${p.t}: ${p.d}`)
      .join('\n') || '- Nenhuma identificada'
  const objs =
    computeObjections(data)
      .slice(0, 4)
      .map((o) => `- ${o.t}`)
      .join('\n') || '- Nenhuma detectada'

  const lines = [
    'ASSISTENTE COMERCIAL — NEOMASTER E NEOPRIME',
    'Resumo da reunião executiva',
    '',
    'IDENTIFICAÇÃO',
    `Lead: ${data.leadName || '—'}`,
    `Empresa: ${data.company || '—'}`,
    `Segmento: ${data.segment || '—'}`,
    `Colaboradores: ${data.employees || '—'}`,
    `Tempo de empresa: ${data.tenure || '—'}`,
    `Canal de origem: ${data.channel || '—'}`,
    `Linha de interesse: ${
      data.interest === 'neomaster'
        ? 'Neomaster'
        : data.interest === 'neoprime'
          ? 'Neoprime'
          : data.interest === 'indefinida'
            ? 'Ainda não definido'
            : '—'
    }`,
    `Participantes: ${data.participants || '—'}`,
    `Decisor presente: ${data.decisor === 'sim' ? 'Sim' : data.decisor === 'nao' ? 'Não' : '—'}`,
    '',
    'QUALIFICAÇÃO',
    `Faturamento anual: ${formatRevenueLabel(data.revenue)}`,
    `Urgência: ${formatUrgencyLabel(data.urgency)}`,
    `Consultoria anterior: ${formatHistoryLabel(data.history)}`,
    `Capacidade de investimento: ${formatLiquidityLabel(data.liquidity)}`,
    `Prontidão emocional: ${formatReadinessLabel(data.readiness)}`,
    `Principal dor: ${data.dorPrincipal || '—'}`,
    `Preocupação com o futuro: ${data.sonoFuturo || '—'}`,
    `Horas em operação: ${data.horasOperacao || '—'}`,
    `Ausência de 15 dias: ${data.sair15Dias || '—'}`,
    `Saída de gestor de confiança: ${data.saidaGestor || '—'}`,
    `Custo de rotatividade: ${data.custoRotatividade || '—'}`,
    `Cenário sem mudança em 12 meses: ${data.cenario12Meses || '—'}`,
    '',
    'RECOMENDAÇÃO',
    `Produto: ${
      tier.line === 'indefinida' ? 'Diagnóstico (linha a definir)' : product.name
    } — tabela ${product.price === 0 ? 'Gratuito' : formatBRL(product.price)}`,
    `Formato: ${product.format || '—'}`,
    `Racional: ${tier.reason}`,
    '',
    'DORES TOCADAS',
    pains,
    '',
    'OBJEÇÕES DETECTADAS E TRATATIVAS',
    objs,
    '',
    'ANOTAÇÕES',
    `Compromissos: ${data.compromissos || '—'}`,
    `Números citados: ${data.numerosCitados || '—'}`,
    `Termos do cliente: ${data.termosCliente || '—'}`,
    `Indicações: ${data.indicacoes || '—'}`,
    '',
    'FECHAMENTO',
    `Resultado: ${data.resultado || '—'}`,
    `Condição escolhida: ${data.condicaoEscolhida || '—'}`,
    `Forma de pagamento: ${data.formaPagamento || '—'}`,
    `Próximo passo: ${data.proximoPasso || '—'}`,
    `Data do próximo contato: ${data.dataProximoContato || '—'}`,
  ]

  return lines.join('\n')
}

// -----------------------------------------------------------------------------
// FORMATAÇÃO DE LABELS
// -----------------------------------------------------------------------------

export function formatRevenueLabel(r: string): string {
  const map: Record<string, string> = {
    ate1: 'Até 1 milhão',
    '1a5': '1 a 5 milhões',
    '5a20': '5 a 20 milhões',
    '20a50': '20 a 50 milhões',
    acima50: 'Acima de 50 milhões',
  }
  return map[r] || '—'
}

export function formatUrgencyLabel(u: string): string {
  const map: Record<string, string> = {
    baixo: 'Baixo',
    medio: 'Médio',
    alto: 'Alto',
    critico: 'Crítico',
  }
  return map[u] || '—'
}

export function formatHistoryLabel(h: string): string {
  const map: Record<string, string> = {
    funcionou: 'Sim, funcionou',
    nao_funcionou: 'Sim, não funcionou',
    nunca: 'Nunca',
  }
  return map[h] || '—'
}

export function formatLiquidityLabel(l: string): string {
  const map: Record<string, string> = {
    confortavel: 'Confortável',
    apertada: 'Apertada mas viável',
    sem: 'Sem liquidez no momento',
  }
  return map[l] || '—'
}

export function formatReadinessLabel(r: string): string {
  const map: Record<string, string> = {
    aberto: 'Aberto e ciente do problema',
    reconhece: 'Reconhece mas desconfia',
    cetico: 'Cético',
    vitimista: 'Vitimista',
  }
  return map[r] || '—'
}
