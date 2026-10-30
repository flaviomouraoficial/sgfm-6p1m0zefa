/**
 * TEXTO INTEGRAL VERBATIM DO MODELO DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TREINAMENTO EMPRESARIAL
 * Fonte: modelo contrato-d604b.docx anexado à tarefa.
 *
 * REGRA MANDATÓRIA: NÃO reescreva, resuma ou reordene cláusulas.
 * CLÁUSULA DE PREVALÊNCIA: Cláusula Vigésima Primeira, antes do foro (que vira Cláusula Vigésima Segunda).
 * Se despesas de viagem estiverem desativadas: Cláusula Sétima é suprimida e as seguintes são renumeradas,
 * ajustando todas as remissões internas.
 */

export const DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA =
  'A CONTRATANTE declara, para todos os fins de direito, que contrata os serviços no âmbito de sua atividade empresarial, destinando-os exclusivamente à capacitação e ao desenvolvimento de seus empregados e colaboradores, não se tratando de contratação para uso ou consumo pessoal, próprio ou familiar, razão pela qual reconhece a natureza empresarial do presente instrumento.'

export const NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA =
  'A identificação nominal dos participantes integra este instrumento como registro da destinação empresarial declarada pela CONTRATANTE no preâmbulo.'

export const CLAUSULA_PREVALENCIA_TITULO_EXATO =
  'Cláusula Vigésima Primeira – DA PREVALÊNCIA SOBRE OS TERMOS E CONDIÇÕES GERAIS'

export const CLAUSULA_PREVALENCIA_TEXTO_EXATO =
  'Este instrumento é celebrado entre pessoas jurídicas, em contexto empresarial, e prevalece expressamente sobre os Termos e Condições Gerais publicados nos canais da CONTRATADA, que se aplicam apenas de forma subsidiária e no que não contrariar o disposto neste contrato.'

export const CLAUSULA_PREVALENCIA_PARAGRAFO_UNICO_EXATO =
  'Parágrafo único. As partes reconhecem que a contratação é empresarial, regida pelos arts. 421, 421-A e 422 do Código Civil, não se aplicando ao presente instrumento as disposições consumeristas do Código de Defesa do Consumidor, especialmente o direito de arrependimento do art. 49, dada a natureza profissional da contratação, a destinação empresarial declarada pela CONTRATANTE no preâmbulo e a ausência de destinação final econômica do serviço pela CONTRATADA.'

export const MODELO_PROGRAMA_PADRAO = {
  nome: 'PROGRAMA DE DESENVOLVIMENTO DA LIDERANÇA',
  objeto_sugerido:
    'capacitação e desenvolvimento de liderança in company através do Programa de Desenvolvimento da Liderança',
  modulos_exemplo: [
    {
      servico: 'Módulo 1 – LIDERANÇA EFICAZ',
      data_ou_periodo: '03/10/2026, das 8h às 12h',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '10/10/2026',
    },
    {
      servico: 'Módulo 2 – COMUNICAÇÃO ASSERTIVA E FEEDBACK',
      data_ou_periodo: '17/10/2026, das 8h às 12h',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '24/10/2026',
    },
    {
      servico: 'Módulo 3 – GESTÃO DE CONFLITOS E INTELIGÊNCIA EMOCIONAL',
      data_ou_periodo: '31/10/2026, das 8h às 12h',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '07/11/2026',
    },
    {
      servico: 'Módulo 4 – ORIENTAÇÃO PARA RESULTADOS',
      data_ou_periodo: '14/11/2026, das 8h às 12h',
      carga_horaria_horas: 4,
      formato: 'Presencial',
      participantes_max: 90,
      valor_parcela: 4000,
      vencimento: '21/11/2026',
    },
  ],
  anexo_ementas_exemplo: [
    {
      titulo: 'Módulo 1 – LIDERANÇA EFICAZ (4h)',
      carga_horaria: '4h',
      topicos: [
        'o que é liderança de verdade e na prática',
        'a liderança como competência e não como posição',
        'a trilha de desenvolvimento da liderança',
        'os diferentes papéis do líder',
        'pessoas, processos e resultados',
        'pontos críticos: autoliderança, poder, ego, interesses, tempo e informação',
      ],
    },
    {
      titulo: 'Módulo 2 – COMUNICAÇÃO ASSERTIVA E FEEDBACK (4h)',
      carga_horaria: '4h',
      topicos: [
        'comunicação assertiva na prática',
        'formas de se comunicar: oportunidades e riscos',
        'barreiras à comunicação eficaz',
        'conversas difíceis',
        'comunicação não violenta',
        'escuta ativa',
        'feedback assertivo',
      ],
    },
    {
      titulo: 'Módulo 3 – GESTÃO DE CONFLITOS E INTELIGÊNCIA EMOCIONAL (4h)',
      carga_horaria: '4h',
      topicos: [
        'gestão de conflitos na organização',
        'conflitos intrapessoal, interpessoal e organizacional',
        'diferentes perfis',
        'liderança de diferentes gerações',
        'gestão de conflito x gestão de picuinhas',
        'inteligência emocional na prática',
      ],
    },
    {
      titulo: 'Módulo 4 – ORIENTAÇÃO PARA RESULTADOS (4h)',
      carga_horaria: '4h',
      topicos: [
        'foco no processo, pessoas e resultados',
        'desempenho individual e coletivo',
        'pontos fortes e fracos do time',
        'conexão entre tática, estratégia, competências e demandas',
        'monitoramento e análise de resultados',
        'melhoria contínua',
      ],
    },
  ],
}
