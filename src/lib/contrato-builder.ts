import {
  DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA,
  CLAUSULA_PREVALENCIA_PARAGRAFO_UNICO_EXATO,
} from './contrato-verbatim-text'

export interface DadosContratoGeracao {
  numeroContrato: string
  // Contratada
  contratadaNome: string
  contratadaRazaoSocial: string
  contratadaCnpj: string
  contratadaEnderecoCompleto: string
  contratadaCidadeUf: string
  contratadaTelefone: string
  contratadaEmailNotificacoes: string
  repContratadaNome: string
  repContratadaNacionalidade: string
  repContratadaEstadoCivil: string
  repContratadaProfissao: string
  repContratadaRg: string
  repContratadaCpf: string
  repContratadaEmail: string
  // Contratante
  contratanteNome: string
  contratanteRazaoSocial: string
  contratanteCnpj: string
  contratanteEnderecoCompleto: string
  contratanteCidadeUf: string
  contratanteEmailNotificacoes: string
  repContratanteNome: string
  repContratanteNacionalidade: string
  repContratanteEstadoCivil: string
  repContratanteProfissao: string
  repContratanteRg: string
  repContratanteCpf: string
  repContratanteEmail: string
  // Objeto e vigência
  objetoDescricao: string
  dataInicioExtenso: string
  dataTerminoExtenso: string
  dataAssinaturaExtenso: string
  cidadeDataAssinatura: string // Ex: "Londrina-PR, 24 de Outubro de 2026"
  // Tabela
  modulos: Array<{
    servico: string
    data_ou_periodo: string
    carga_horaria_horas: number
    formato: string
    participantes_max: number
    valor_parcela: number
    vencimento: string
    participantes_nominais?: Array<{ nome_completo: string; cpf: string }>
  }>
  valorTotal: number
  cargaHorariaTotal: number
  // Condições específicas
  formatoGeral: 'Presencial' | 'Online' | 'Hibrido'
  localInfraestrutura?: string
  plataformaVideoconferencia?: string
  provedorAcessoPlataforma?: string
  despesasViagemAtivas: boolean
  despesasTransporte?: string
  despesasHospedagem?: string
  despesasAlimentacao?: string
  despesasDeslocamentoLocal?: string
  haveraTestemunhas: boolean
  testemunhas?: Array<{ nome: string; rg: string }>
  consultorResponsavel: string
  // Anexo
  anexoPropostaNumero?: string
  anexoPropostaData?: string
  anexoPropostaValidade?: string
  anexoProgramaNome?: string
  anexoModulos?: Array<{ titulo: string; carga_horaria: string; topicos: string[] }>
  // Aceite auditoria
  aceiteDataHora: string
  aceiteUsuarioNome: string
  aceiteIp: string
}

export type ClausulaEstruturada = {
  numeroOrdinal: string // "Primeira", "Segunda", etc.
  titulo: string
  corpo: string[]
  paragrafos: Array<{ titulo?: string; texto: string }>
  itensLetras?: Array<{ letra: string; texto: string }>
  isTabela?: boolean
}

/**
 * Constrói o texto integral do contrato respeitando a ativação ou supressão da Cláusula Sétima.
 * Quando despesasViagemAtivas for falso, a Cláusula Sétima é suprimida e as seguintes são renumeradas,
 * e as remissões internas do texto são ajustadas dinamicamente.
 */
export function construirClausulasContrato(dados: DadosContratoGeracao): ClausulaEstruturada[] {
  const comViagem = dados.despesasViagemAtivas
  const isOnline = dados.formatoGeral === 'Online'

  // Mapeamento ordinal
  const ordinais = [
    'Primeira',
    'Segunda',
    'Terceira',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sétima',
    'Oitava',
    'Nona',
    'Décima',
    'Décima Primeira',
    'Décima Segunda',
    'Décima Terceira',
    'Décima Quarta',
    'Décima Quinta',
    'Décima Sexta',
    'Décima Sétima',
    'Décima Oitava',
    'Décima Nona',
    'Vigésima',
    'Vigésima Primeira',
    'Vigésima Segunda',
  ]

  // Se comViagem == true:
  // C1: Objeto
  // C2: Tabela
  // C3: Proposta Comercial e Anexo
  // C4: Prestação dos Serviços
  // C5: Remuneração
  // C6: Suspensão
  // C7: Despesas de Viagem
  // C8: Condições Gerais e Falha
  // C9: Rescisão
  // C10: Multa Cancelamento/Reagendamento
  // C11: Multa Atraso Pagamento
  // C12: Infraestrutura e Logística
  // C13: Atraso Início
  // C14: Propriedade Intelectual
  // C15: Vedação Captação Consultores
  // C16: LGPD e Portfólio
  // C17: Integridade
  // C18: Notificações
  // C19: Disposições Finais
  // C20: Prevalência sobre Termos Gerais (Vigésima Primeira) -> Foro (Vigésima Segunda)

  // Nomes de remissões:
  const refClausulaSegunda = 'Cláusula Segunda'
  const refClausulaQuinta = 'Cláusula Quinta'
  const refClausulaSetima = comViagem ? 'Cláusula Sétima' : 'Cláusula de Despesas'
  const refClausulaNona = comViagem ? 'Cláusula Nona' : 'Cláusula Oitava'
  const refClausulaDecima = comViagem ? 'Cláusula Décima' : 'Cláusula Nona'
  const refClausulaDecimaPrimeira = comViagem ? 'Cláusula Décima Primeira' : 'Cláusula Décima'
  const refClausulaDecimaOitava = comViagem ? 'Cláusula Décima Oitava' : 'Cláusula Décima Sétima'

  const lista: ClausulaEstruturada[] = []

  // Cláusula 1
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DO OBJETO E DA DURAÇÃO',
    corpo: [
      `O presente contrato tem por objeto a prestação de serviços profissionais de ${dados.objetoDescricao.toUpperCase()}, conforme o programa, os módulos, os eventos e as atividades, as datas ou períodos, as cargas horárias, o número de participantes e os valores identificados na tabela da ${refClausulaSegunda}, contemplando os serviços no período de ${dados.dataInicioExtenso} a ${dados.dataTerminoExtenso}, com o conteúdo programático detalhado no ANEXO ÚNICO – PROPOSTA COMERCIAL, que dele faz parte integrante e inseparável.`,
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo único.',
        texto: `O presente contrato vigorará até a execução do último módulo, evento ou atividade constante da tabela da ${refClausulaSegunda}, observado o prazo máximo de 12 (doze) meses contados da data de sua assinatura, prorrogável mediante aditivo escrito. Ultrapassado esse prazo sem a conclusão dos serviços e sem formalização de aditivo de prorrogação em até 30 (trinta) dias contados do término, o contrato extinguir-se-á automaticamente, sem multa nem verba rescisória, permanecendo devidas as parcelas dos módulos, eventos ou atividades já realizados e tornando-se não devidas as parcelas dos não realizados.`,
      },
    ],
  })

  // Cláusula 2
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA IDENTIFICAÇÃO DO PROJETO',
    corpo: [
      'Os serviços objeto deste contrato estão identificados na tabela a seguir, que faz parte integrante deste contrato e serve de base para todas as disposições dele constantes, inclusive para o cálculo de multas, verba rescisória e encargos de mora:',
    ],
    isTabela: true,
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'O conteúdo programático detalhado de cada módulo ou evento consta do ANEXO ÚNICO – PROPOSTA COMERCIAL. A tabela admite, além de módulos, eventos avulsos e atividades com período estendido, hipótese em que a coluna de data indicará o período de realização. Eventual ajuste de data de módulo ou evento, pactuado por escrito entre as partes, será formalizado por aditivo simples que atualiza a tabela acima, sem necessidade de celebração de novo contrato.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto: `Em caso de reagendamento de módulo ou evento, o vencimento da respectiva parcela será recalculado a partir da nova data de realização, mantido o mesmo intervalo, contado em dias corridos, originalmente previsto na tabela da ${refClausulaSegunda} entre a realização e o vencimento.`,
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'A tabela fixa o número máximo de participantes por módulo ou evento. Havendo demanda de participação superior ao máximo previsto, caberá à CONTRATADA aceitar ou não a ampliação, podendo a aceitação implicar ajuste de valor, formalizado por aditivo. A recusa da ampliação não configura falha nem inadimplemento, realizando-se o módulo ou evento com o número máximo previsto.',
      },
      {
        titulo: 'Parágrafo quarto.',
        texto: `Para os itens da tabela cuja coluna de data indique período de realização, a data de referência para aplicação das multas, prazos e antecedências da ${refClausulaDecima} será a data de início do período.`,
      },
    ],
  })

  // Cláusula 3
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA PROPOSTA COMERCIAL E DO ANEXO ÚNICO',
    corpo: [
      'A proposta comercial apresentada pela CONTRATADA e aceita pela CONTRATANTE integra este contrato como ANEXO ÚNICO, contendo o conteúdo programático detalhado dos módulos ou eventos, as ementas, os materiais de apoio previstos e as condições de despesas de viagem.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'A aprovação da proposta comercial pela CONTRATANTE, por qualquer meio escrito (inclusive eletrônico), implica a plena e integral aceitação das condições nela constantes, que passam a integrar este contrato como se dele fizessem parte transcritas.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'Somente poderá ser anexada a este contrato a versão final da proposta comercial, com todas as opções nela existentes previamente resolvidas e marcadas pela CONTRATANTE, não sendo admitida a anexação de proposta contendo alternativas pendentes de escolha, campos em branco ou condições condicionais não definidas.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'Em caso de divergência entre o corpo deste contrato e o ANEXO ÚNICO, prevalece o corpo deste contrato, salvo quanto ao conteúdo programático detalhado dos módulos ou eventos, matéria própria do anexo.',
      },
    ],
  })

  // Cláusula 4
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA PRESTAÇÃO DOS SERVIÇOS',
    corpo: [
      `A CONTRATADA deverá, durante a vigência deste contrato e em contrapartida do pagamento especificado na ${refClausulaQuinta}, prestar os serviços descritos no ANEXO ÚNICO – PROPOSTA COMERCIAL e identificados na tabela da ${refClausulaSegunda}, conduzindo cada módulo ou evento na data, no período, no local ou no formato e com a carga horária neles previstos.`,
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo único.',
        texto:
          'Os treinamentos serão conduzidos pelo consultor indicado no ANEXO ÚNICO. Eventual substituição somente poderá ocorrer mediante prévia e expressa aprovação da CONTRATANTE.',
      },
    ],
  })

  // Cláusula 5
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA REMUNERAÇÃO DOS SERVIÇOS',
    corpo: [
      `Pela prestação dos serviços indicados neste contrato, a CONTRATANTE efetuará o pagamento à CONTRATADA do valor total e das parcelas constantes da tabela da ${refClausulaSegunda}, cada parcela correspondente ao respectivo módulo ou evento e devida na data de vencimento nela indicada.`,
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'Constituir-se-á em mora o devedor, nos exatos termos do art. 394 do Código Civil, sem prejuízo do disposto no Parágrafo quarto.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'O pagamento de cada parcela ocorrerá após a apresentação, pela CONTRATADA, da correspondente nota fiscal.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'Os valores dos impostos oriundos da prestação dos serviços indicados neste contrato ficarão sob a responsabilidade da CONTRATADA.',
      },
      {
        titulo: 'Parágrafo quarto.',
        texto: `A mora da CONTRATANTE somente se configura após a apresentação da nota fiscal e do boleto correspondentes. Caso a apresentação ocorra após a data de vencimento constante da tabela da ${refClausulaSegunda}, o vencimento da respectiva parcela prorroga-se para o 5º (quinto) dia útil seguinte ao da apresentação.`,
      },
    ],
  })

  // Cláusula 6
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA SUSPENSÃO POR INADIMPLEMENTO DA CONTRATANTE',
    corpo: [
      `Verificada a inadimplência da CONTRATANTE quanto a qualquer parcela vencida e não paga por mais de 15 (quinze) dias, contados do vencimento, a CONTRATADA poderá suspender a execução dos módulos ou eventos subsequentes, mediante comunicação escrita, sem que isso configure inadimplemento de sua parte, permanecendo integralmente devidas as parcelas dos módulos ou eventos já realizados e os encargos da ${refClausulaDecimaPrimeira}.`,
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'A suspensão não altera o valor das parcelas dos módulos ou eventos pendentes, que permanecem devidos, cabendo às partes ajustar novo cronograma para sua execução.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto: `A suspensão regular prevista nesta cláusula não configura atraso imputável à CONTRATADA para os fins do Parágrafo terceiro da ${refClausulaNona}, e o reagendamento dos módulos ou eventos decorrente da suspensão não gera multa da ${refClausulaDecima}.`,
      },
    ],
  })

  // Se ativado: Cláusula Sétima – Despesas de viagem
  if (comViagem) {
    lista.push({
      numeroOrdinal: ordinais[lista.length],
      titulo: 'DAS DESPESAS DE VIAGEM E DOS REEMBOLSOS',
      corpo: [
        'As despesas de viagem necessárias à execução dos serviços, compreendendo transporte (aéreo, terrestre ou rodoviário), hospedagem e alimentação do consultor, quando aplicáveis, observarão exclusivamente as condições descritas no ANEXO ÚNICO – PROPOSTA COMERCIAL, que define os casos de cobertura, os critérios de contratação e a forma de reembolso ou inclusão no valor do contrato.',
      ],
      paragrafos: [
        {
          titulo: 'Parágrafo primeiro.',
          texto:
            'A aprovação da proposta pela CONTRATANTE implica a aceitação das condições de despesas de viagem nela descritas, nas quais a CONTRATADA se baseou para precificar o contrato.',
        },
        {
          titulo: 'Parágrafo segundo.',
          texto:
            'As despesas de viagem previstas no ANEXO ÚNICO são automaticamente autorizadas e serão cobradas ou reembolsadas conforme as condições nele pactuadas.',
        },
        {
          titulo: 'Parágrafo terceiro.',
          texto: `Despesa extraordinária, não prevista no ANEXO ÚNICO, decorrente de imposição da CONTRATANTE ou de necessidade comprovada da execução, será comunicada pela CONTRATADA à CONTRATANTE, por escrito, no momento em que se verificar. Caso a CONTRATANTE não se manifeste, por escrito, no prazo de 5 (cinco) dias úteis contados do recebimento da comunicação, a despesa considerar-se-á aprovada, cabendo à CONTRATADA efetuar o pagamento ou o adiantamento do valor correspondente e cobrar da CONTRATANTE, posteriormente, o reembolso integral do montante despendido, mediante apresentação de comprovantes, com acréscimo de encargos de mora a partir da notificação. O reembolso deverá ser quitado em até 15 (quinze) dias contados do recebimento da respectiva cobrança, aplicando-se, em caso de atraso, o regime da ${refClausulaDecimaPrimeira}.`,
        },
        {
          titulo: 'Parágrafo quarto.',
          texto:
            'A CONTRATADA não será obrigada a iniciar ou prosseguir a execução do módulo ou evento cujas condições de viagem pactuadas não tenham sido honradas pela CONTRATANTE, sem que isso configure inadimplemento de sua parte.',
        },
      ],
    })
  }

  // Cláusula: Condições gerais e falha
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DAS CONDIÇÕES GERAIS E DA DEFINIÇÃO DE FALHA',
    corpo: [
      'A CONTRATADA será responsável por si e pelos atos de seus profissionais no atendimento à prestação de serviços ajustada, sendo certo que, se houver a comprovação de falha, obriga-se a corrigi-la e repará-la sem nenhum tipo de cobrança.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto: `Para os fins deste contrato, considera-se falha o descumprimento do conteúdo programático constante do ANEXO ÚNICO ou da carga horária pactuada na tabela da ${refClausulaSegunda}, devidamente comprovado e comunicado pela CONTRATANTE por escrito, na forma da ${refClausulaDecimaOitava}, em até 15 (quinze) dias contados da realização do módulo ou evento. A insatisfação subjetiva dos participantes quanto ao conteúdo, ao estilo ou à metodologia, por si só, não configura falha.`,
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'Comprovada a falha, a correção dar-se-á, à escolha da CONTRATADA, pela reposição do módulo ou evento em data ajustada entre as partes, sem custo adicional, ou pela devolução proporcional do valor da parcela correspondente ao conteúdo não prestado.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'A CONTRATADA prestará serviços à CONTRATANTE com ampla, total e irrestrita autonomia, sem qualquer tipo de subordinação trabalhista.',
      },
      {
        titulo: 'Parágrafo quarto.',
        texto:
          'A CONTRATADA cumprirá rigorosamente seus deveres de observância de sigilo e da ética profissional, fazendo as recomendações oportunas e desenvolvendo os demais atos e funções, necessários ou convenientes ao bom cumprimento das atribuições contratadas.',
      },
      {
        titulo: 'Parágrafo quinto.',
        texto:
          'A CONTRATADA se compromete, ainda, a manter o caráter sigiloso das informações às quais poderá ter acesso em função deste contrato, tomando todas as medidas cabíveis para que tais informações somente sejam divulgadas àquelas pessoas que delas dependam para a execução dos serviços objeto deste contrato.',
      },
      {
        titulo: 'Parágrafo sexto.',
        texto:
          'A CONTRATADA indicará um consultor para conduzir cada módulo ou evento, de forma a cumprir o cronograma apresentado.',
      },
    ],
  })

  // Cláusula: Rescisão
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA RESCISÃO',
    corpo: [
      'Este contrato poderá ser rescindido por qualquer uma das partes, desde que a outra parte seja cientificada, por escrito, com antecedência mínima de 30 (trinta) dias.',
      'Ocorrendo rescisão imotivada do contrato, ou seja, sem nenhuma infração legal das partes envolvidas, será paga a seguinte verba rescisória:',
    ],
    itensLetras: [
      {
        letra: 'a)',
        texto:
          'havendo rescisão contratual de iniciativa da CONTRATADA, incorrerá a mesma no pagamento à CONTRATANTE de metade do valor das parcelas vincendas, referentes aos módulos ou eventos ainda não realizados;',
      },
      {
        letra: 'b)',
        texto:
          'havendo rescisão contratual por parte da CONTRATANTE, incidirá a mesma no pagamento à CONTRATADA de metade do valor das parcelas vincendas, referentes aos módulos ou eventos ainda não realizados.',
      },
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto: `A verba rescisória prevista nesta cláusula não incide, nem se acumula, sobre as parcelas dos módulos ou eventos alcançadas pela multa por cancelamento da ${refClausulaDecima}, hipótese em que prevalece, quanto a elas, o regime da multa.`,
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'Na hipótese de cancelamento de qualquer módulo por iniciativa da CONTRATADA, de não realização por motivo a ela imputável ou de necessidade de reagendamento por sua responsabilidade, a CONTRATANTE poderá optar pelo reagendamento, sem qualquer custo adicional, em data ajustada entre as partes, ou pelo cancelamento do respectivo módulo, hipótese em que a parcela correspondente não será devida, devendo eventual valor já pago ser integralmente restituído.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'O atraso na realização de módulo ou evento por motivo imputável à CONTRATADA, superior a 15 (quinze) dias da data pactuada, autoriza a CONTRATANTE a cancelar o respectivo módulo ou evento sem qualquer custo, com restituição integral de eventual valor já pago.',
      },
      {
        titulo: 'Parágrafo quarto.',
        texto:
          'Permanecem devidas, em qualquer hipótese de rescisão, as parcelas correspondentes aos módulos ou eventos já realizados até a data da rescisão.',
      },
    ],
  })

  // Cláusula: Multa por cancelamento ou reagendamento
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA MULTA POR CANCELAMENTO OU REAGENDAMENTO POR INICIATIVA DA CONTRATANTE',
    corpo: [
      'Ficam estabelecidas multas específicas e distintas para o cancelamento ou reagendamento de módulos ou eventos individuais e para o cancelamento do programa completo, conforme o disposto nesta cláusula.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro – Cancelamento de módulo ou evento individual.',
        texto:
          'Havendo cancelamento de módulo ou evento individual por iniciativa da CONTRATANTE com antecedência superior a 30 (trinta) dias da data prevista para sua realização, não será devida multa, cabendo às partes ajustar nova data sem custo adicional.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto: `Havendo cancelamento de módulo ou evento individual por iniciativa da CONTRATANTE com antecedência igual ou inferior a 30 (trinta) dias e superior a 7 (sete) dias da data prevista para sua realização, a CONTRATANTE pagará à CONTRATADA multa equivalente a 50% (cinquenta por cento) do valor da parcela correspondente ao módulo ou evento cancelado, constante da tabela da ${refClausulaSegunda}.`,
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto: `Havendo cancelamento de módulo ou evento individual por iniciativa da CONTRATANTE com antecedência inferior a 7 (sete) dias da data prevista para sua realização, a CONTRATANTE pagará à CONTRATADA multa equivalente a 100% (cem por cento) do valor da parcela correspondente ao módulo ou evento cancelado, constante da tabela da ${refClausulaSegunda}.`,
      },
      {
        titulo: 'Parágrafo quarto – Reagendamento por iniciativa da CONTRATANTE.',
        texto:
          'O reagendamento de módulo ou evento solicitado pela CONTRATANTE com antecedência superior a 30 (trinta) dias da data prevista não gera multa. O reagendamento solicitado com antecedência igual ou inferior a 30 (trinta) dias e superior a 7 (sete) dias sujeita-se a multa de 50% (cinquenta por cento) do valor da parcela do módulo ou evento reagendado; o solicitado com antecedência inferior a 7 (sete) dias, a multa de 100% (cem por cento) do mesmo valor.',
      },
      {
        titulo: 'Parágrafo quinto.',
        texto:
          'A multa devida por reagendamento será abatida do valor da parcela do módulo ou evento caso este seja efetivamente realizado em data nova pactuada dentro do prazo de 90 (noventa) dias contados da data originalmente prevista. Não se verificando a realização nesse prazo, a multa permanece devida em valor integral e o módulo ou evento será tratado como cancelado para todos os fins.',
      },
      {
        titulo: 'Parágrafo sexto – Cancelamento do programa completo.',
        texto: `Havendo cancelamento do programa completo por iniciativa da CONTRATANTE, aplicam-se cumulativamente: (i) as multas desta cláusula sobre as parcelas dos módulos ou eventos ainda não realizados cuja data prevista situe-se no intervalo de 30 (trinta) dias ou menos contados da data do cancelamento, nos percentuais dos Parágrafos segundo e terceiro; e (ii) a verba rescisória da ${refClausulaNona} sobre as parcelas dos demais módulos ou eventos ainda não realizados, situados fora desse intervalo. A multa prevista nesta cláusula substitui, quanto às parcelas sobre as quais incidir, a verba rescisória da ${refClausulaNona}, não havendo cumulação de multa e verba rescisória sobre a mesma parcela.`,
      },
      {
        titulo: 'Parágrafo sétimo.',
        texto:
          'As multas desta cláusula têm natureza compensatória, em razão do bloqueio de agenda do consultor, da preparação dos materiais e da inviabilidade de comercialização da data com terceiros, e não constituem penalidade indevida, autorizando a CONTRATADA a emitir a respectiva nota fiscal de serviço.',
      },
      {
        titulo: 'Parágrafo oitavo.',
        texto: `A multa por cancelamento ou reagendamento será faturada pela CONTRATADA em até 5 (cinco) dias úteis contados da comunicação do cancelamento ou do reagendamento, mediante nota fiscal de serviços própria, com vencimento em 15 (quinze) dias contados da emissão, aplicando-se, em caso de atraso no pagamento, o regime da ${refClausulaDecimaPrimeira}.`,
      },
      {
        titulo: 'Parágrafo nono.',
        texto:
          'O cancelamento ou o reagendamento do módulo ou evento por motivo de caso fortuito ou força maior devidamente comprovado dispensa a aplicação das multas, cabendo apenas o reagendamento.',
      },
    ],
  })

  // Cláusula: Multa por atraso de pagamento
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA MULTA POR ATRASO DE PAGAMENTO',
    corpo: [
      'A CONTRATANTE pagará multa de 2% (dois por cento) do valor corrigido de cada parcela referida neste contrato em caso de atraso no pagamento de qualquer parcela, sem prejuízo de juros de mora à base de 1% (um por cento) ao mês, calculados pro-rata tempore entre a data do vencimento e a data do efetivo pagamento, além da correção monetária.',
    ],
    paragrafos: [],
  })

  // Cláusula: Infraestrutura e logística
  if (isOnline) {
    lista.push({
      numeroOrdinal: ordinais[lista.length],
      titulo: 'DA INFRAESTRUTURA E DA LOGÍSTICA DO EVENTO',
      corpo: [
        `Quando os serviços forem executados em formato on-line, caberá à CONTRATANTE fornecer a plataforma de videoconferência (${dados.plataformaVideoconferencia || 'indicada no Anexo Único'}) e o acesso dos participantes, salvo condição diversa pactuada no ANEXO ÚNICO.`,
      ],
      paragrafos: [
        {
          titulo: 'Parágrafo único.',
          texto:
            'A CONTRATADA poderá, a qualquer momento, apontar por escrito inadequação da plataforma ou da conexão fornecida, hipótese em que eventual limitação decorrente dessa inadequação não configurará falha na prestação dos serviços.',
        },
      ],
    })
  } else {
    lista.push({
      numeroOrdinal: ordinais[lista.length],
      titulo: 'DA INFRAESTRUTURA E DA LOGÍSTICA DO EVENTO',
      corpo: [
        'Quando os serviços forem executados de forma presencial, caberá à CONTRATANTE fornecer, às suas expensas, a infraestrutura necessária à realização dos módulos ou eventos, incluindo sala adequada, equipamento de projeção e som, acesso à internet, quando necessário, e condições mínimas de conforto aos participantes.',
      ],
      paragrafos: [
        {
          titulo: 'Parágrafo primeiro.',
          texto:
            'A CONTRATADA poderá, a qualquer momento, apontar por escrito inadequação da infraestrutura fornecida, hipótese em que eventual limitação decorrente dessa inadequação não configurará falha na prestação dos serviços.',
        },
        {
          titulo: 'Parágrafo segundo.',
          texto:
            'Quando os serviços forem executados em formato on-line, caberá à CONTRATANTE fornecer a plataforma de videoconferência e o acesso dos participantes, salvo condição diversa pactuada no ANEXO ÚNICO, aplicando-se à inadequação da plataforma o disposto no Parágrafo primeiro.',
        },
      ],
    })
  }

  // Cláusula: Atraso no início
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DO ATRASO NO INÍCIO DOS MÓDULOS OU EVENTOS',
    corpo: [
      'O atraso no início do módulo ou evento imputável à CONTRATANTE ou aos seus participantes, superior a 30 (trinta) minutos, não obriga a CONTRATADA a prorrogar a carga horária nem gera direito a desconto, permanecendo devida a parcela integral.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo único.',
        texto:
          'Eventual prorrogação da carga horária dependerá de disponibilidade do consultor e do local, pactuada no momento do atraso.',
      },
    ],
  })

  // Cláusula: Propriedade intelectual
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA PROPRIEDADE INTELECTUAL E DA VEDAÇÃO DE GRAVAÇÃO',
    corpo: [
      'Os materiais didáticos, apostilas, slides, instrumentos de avaliação e demais conteúdos desenvolvidos ou utilizados pela CONTRATADA na execução dos serviços permanecem de propriedade exclusiva da CONTRATADA, sendo vedada à CONTRATANTE e aos participantes sua reprodução, distribuição, comercialização ou utilização fora do âmbito do programa contratado.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'Os materiais customizados ou adaptados com informações, marca ou contexto específico da CONTRATANTE permanecem de propriedade exclusiva da CONTRATADA, que concede à CONTRATANTE licença de uso interno, por prazo indeterminado, vedada a revenda, a distribuição externa ou a utilização em treinamentos conduzidos por terceiros.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'É vedada a gravação, por qualquer meio, audiovisual ou sonoro, total ou parcial, dos módulos ou eventos, salvo prévia e expressa autorização escrita da CONTRATADA.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto:
          'Eventual autorização de gravação destina-se exclusivamente ao uso interno da CONTRATANTE para fins de treinamento de seus colaboradores, sendo vedada sua divulgação externa, publicação ou comercialização.',
      },
    ],
  })

  // Cláusula: Vedação de captação
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA VEDAÇÃO DE CAPTAÇÃO DE CONSULTORES',
    corpo: [
      `A CONTRATANTE se obriga a não solicitar, induzir, contratar ou de qualquer forma captar, direta ou indiretamente, durante a vigência deste contrato e pelo prazo de 24 (vinte e quatro) meses contados do seu término, consultores, facilitadores ou colaboradores da CONTRATADA que tenham atuado na execução dos serviços, sob pena de pagamento à CONTRATADA de multa equivalente a 6 (seis) vezes o valor da maior parcela prevista na tabela da ${refClausulaSegunda}, sem prejuízo de perdas e danos.`,
    ],
    paragrafos: [],
  })

  // Cláusula: LGPD e portfólio
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DO TRATAMENTO DE DADOS PESSOAIS E DO USO DO NOME NO PORTFÓLIO',
    corpo: [
      'Em cumprimento à Lei Geral de Proteção de Dados – LGPD (Lei 13.709/2018), a CONTRATADA se obriga a respeitar a privacidade da CONTRATANTE, comprometendo-se a proteger e manter em sigilo todos os dados fornecidos em razão da natureza dos serviços prestados e derivados deste contrato, salvo em casos em que seja obrigada, por autoridades públicas, a revelar tais informações. Nos termos do art. 7º, VI, da LGPD, a CONTRATADA está autorizada a realizar o tratamento de dados pessoais da CONTRATANTE e, com base no art. 10, I, da LGPD, possui o legítimo interesse em armazenar, acessar, avaliar, modificar, transferir e comunicar, sob qualquer forma e pelo tempo necessário à execução dos serviços, todos os documentos, informações de participantes, materiais de apoio, avaliações, relatórios e demais informações relativas ao objeto deste contrato.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto:
          'A operação de tratamento de dados é e sempre será realizada unicamente com o intuito de cumprimento ao objeto contratado.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'No tratamento de dados pessoais de participantes dos treinamentos, incluindo listas de presença, avaliações e resultados individuais, a CONTRATANTE atua como controladora dos dados, cabendo a ela obter as autorizações necessárias e promover as adequações exigidas pela LGPD, e a CONTRATADA atua como operadora, tratando os dados exclusivamente conforme as instruções da CONTRATANTE e para os fins do objeto contratado, podendo promover as adequações técnicas e administrativas necessárias ao cumprimento da legislação.',
      },
      {
        titulo: 'Parágrafo terceiro.',
        texto: `Em caso de incidente de segurança que possa acarretar risco relevante a titulares de dados, a CONTRATADA, na condição de operadora, comunicará o fato à CONTRATANTE, na forma da ${refClausulaDecimaOitava}, em prazo razoável e suficiente para que esta cumpra as obrigações legais de notificação.`,
      },
      {
        titulo: 'Parágrafo quarto.',
        texto:
          'A CONTRATANTE autoriza a CONTRATADA a incluir o seu nome, a sua marca e a sua logomarca no portfólio de serviços e nos materiais institucionais e comerciais da CONTRATADA, inclusive em apresentações, site e redes sociais, mantendo-se integralmente preservada a confidencialidade quanto a dados sensíveis de mercado, informações estratégicas, resultados internos e questões específicas do projeto, que somente poderão ser divulgados com prévia e expressa autorização escrita da CONTRATANTE.',
      },
      {
        titulo: 'Parágrafo quinto.',
        texto:
          'A autorização prevista no Parágrafo quarto poderá ser revogada pela CONTRATANTE, a qualquer tempo, mediante comunicação escrita, hipótese em que a CONTRATADA removerá as referências em suas próximas atualizações de materiais.',
      },
    ],
  })

  // Cláusula: Declaração de integridade
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA DECLARAÇÃO DE INTEGRIDADE',
    corpo: [
      'A CONTRATADA declara que está e sempre esteve comprometida com o comportamento ético e probo nas relações mantidas com entidades e órgãos públicos, em especial os do Poder Judiciário, abstendo-se de praticar condutas de corrupção ou fraudes que impliquem em concessão de vantagens, gratificações, comissões e/ou incentivos indevidos, com a finalidade de influenciar comportamentos ou decisões. Também declara que cumpre e zela para que seus colaboradores e parceiros diretos e indiretos cumpram as regras legais e morais impostas a si, incluindo as leis e normas de prevenção e combate a atos de corrupção, suborno ou lavagem de dinheiro, da mesma forma que jamais autorizou, ofertou, prometeu ou realizou pagamento ou cessão, direta ou indiretamente, de suborno, desconto, compensação, restituição, vantagem ou qualquer tipo de pagamento ilícito a quaisquer agentes públicos, privados ou relacionados à parte contrária em litígio judicial, que pudesse resultar em violação à Lei 12.846/2013 (Lei Anticorrupção).',
    ],
    paragrafos: [],
  })

  // Cláusula: Notificações
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DAS NOTIFICAÇÕES',
    corpo: [
      `Toda e qualquer comunicação, alteração, cancelamento, reagendamento, notificação ou formalização prevista neste contrato deverá ser feita por escrito e dirigida, no caso da CONTRATADA, ao endereço eletrônico ${dados.contratadaEmailNotificacoes || 'flavio@trendconsultoria.com.br'} e, no caso da CONTRATANTE, ao endereço eletrônico indicado no preâmbulo (${dados.contratanteEmailNotificacoes}) ou comunicado por escrito na forma desta cláusula.`,
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo primeiro.',
        texto: 'Considera-se recebida a comunicação no primeiro dia útil seguinte ao do envio.',
      },
      {
        titulo: 'Parágrafo segundo.',
        texto:
          'Comunicações por outros meios, inclusive por aplicativos de mensagem ou verbalmente, não produzem os efeitos previstos neste contrato, salvo se confirmadas por escrito na forma desta cláusula.',
      },
    ],
  })

  // Cláusula: Disposições finais
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DAS DISPOSIÇÕES FINAIS',
    corpo: [
      'Este contrato e o ANEXO ÚNICO – PROPOSTA COMERCIAL constituem a integralidade do acordo entre as partes quanto ao seu objeto, não gerando efeitos promessas, declarações ou condições verbais ou escritas anteriores não constantes de seus instrumentos.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo único.',
        texto:
          'A nulidade ou a invalidade de qualquer disposição deste contrato não arrasta a das demais, que permanecerão plenamente eficazes.',
      },
    ],
  })

  // PARTE 10: Cláusula de Prevalência (Vigésima Primeira se com viagem, ou renumerada caso sem viagem)
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DA PREVALÊNCIA SOBRE OS TERMOS E CONDIÇÕES GERAIS',
    corpo: [
      'Este instrumento é celebrado entre pessoas jurídicas, em contexto empresarial, e prevalece expressamente sobre os Termos e Condições Gerais publicados nos canais da CONTRATADA, que se aplicam apenas de forma subsidiária e no que não contrariar o disposto neste contrato.',
    ],
    paragrafos: [
      {
        titulo: 'Parágrafo único.',
        texto: CLAUSULA_PREVALENCIA_PARAGRAFO_UNICO_EXATO,
      },
    ],
  })

  // Cláusula: Do Foro (Vigésima Segunda se com viagem, ou renumerada)
  lista.push({
    numeroOrdinal: ordinais[lista.length],
    titulo: 'DO FORO',
    corpo: [
      'As partes elegem o foro da comarca de Londrina – PR para dirimir quaisquer litígios oriundos do presente instrumento, com expressa renúncia a qualquer outro, por mais privilegiado que se apresente.',
      `Assim, por estarem justos e acordados, em conformidade com o art. 594 do Código Civil Brasileiro, assinam o presente em 2 (duas) vias de igual teor e forma${
        dados.haveraTestemunhas && dados.testemunhas && dados.testemunhas.length > 0
          ? ` e na presença de ${dados.testemunhas.length} testemunha(s)`
          : ' e perante seus representantes legais'
      }.`,
    ],
    paragrafos: [],
  })

  return lista
}
