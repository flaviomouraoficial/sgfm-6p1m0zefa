import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')

  if (!token) {
    console.error('ERRO CRÍTICO: Credencial do Mercado Pago não encontrada.')
    return new Response(
      JSON.stringify({ error: 'Credenciais de pagamento não configuradas no servidor.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }

  try {
    const accessToken = token.trim()

    // Extração e validação dos dados da requisição
    const reqBody = await req.json()
    const { usuario_id, pacote_id, usuario_email } = reqBody

    if (!usuario_id || !pacote_id) {
      throw new Error('usuario_id e pacote_id são obrigatórios')
    }

    // Inicialização do Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Erro de configuração do banco de dados (Secrets ausentes)')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Busca das informações do pacote no banco
    const { data: plano, error: planoError } = await supabase
      .from('pacotes_creditos')
      .select('id, nome, valor, quantidade_creditos')
      .eq('id', pacote_id)
      .maybeSingle()

    if (planoError || !plano) {
      throw new Error(
        `Erro ao buscar o pacote selecionado: ${planoError?.message || 'Pacote inexistente'}`,
      )
    }

    // Criação da transação pendente (para gerar o external_reference)
    const { data: transacao, error: txError } = await supabase
      .from('transacoes_pagamento')
      .insert({
        usuario_id,
        pacote_id,
        valor_pago: plano.valor,
        status_pagamento: 'pendente',
      })
      .select('id')
      .single()

    if (txError || !transacao) {
      throw new Error(`Falha ao registrar transação preliminar: ${txError?.message}`)
    }

    const origin = req.headers.get('origin') || 'https://plataforma-prisma-a971d.goskip.app'
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-mercado-pago`

    // Lembrete: se o email do comprador for o mesmo do vendedor, o MP desabilita as formas de pagamento.
    // Para garantir que o checkout SEMPRE funcione (especialmente em testes), vamos usar um email dummy
    // gerado a partir do ID do usuário, desvinculando completamente da conta do vendedor.
    const payerEmail = `comprador-${usuario_id.substring(0, 8)}@sandbox.plataformaprisma.com.br`

    // Construção rigorosa do body de preferência para evitar bugs visuais (como itens duplicados)
    const preferenceBody = {
      items: [
        {
          id: plano.id,
          title: `Créditos PRISMA - ${plano.nome}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(plano.valor),
        },
      ],
      payer: {
        email: payerEmail,
        name: 'Cliente',
        surname: 'PRISMA',
      },
      external_reference: transacao.id,
      back_urls: {
        success: `${origin}/store?status=success`,
        failure: `${origin}/store?status=failure`,
        pending: `${origin}/store?status=pending`,
      },
      auto_return: 'approved',
      notification_url: webhookUrl,
      statement_descriptor: 'PRISMA',
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceBody),
    })

    const preferenceResult = await mpResponse.json()

    if (!mpResponse.ok || !preferenceResult.id) {
      console.error('Erro retornado pelo Mercado Pago:', preferenceResult)
      throw new Error(
        `Falha de comunicação com o Mercado Pago: ${preferenceResult.message || 'ID não retornado'}`,
      )
    }

    // Atualizar a transação com o ID gerado pelo Mercado Pago
    await supabase
      .from('transacoes_pagamento')
      .update({ id_mercado_pago: preferenceResult.id })
      .eq('id', transacao.id)

    console.log('Preferência criada com sucesso:', preferenceResult.id)

    // Retornar URL de checkout limpa para o front-end
    return new Response(
      JSON.stringify({
        init_point: preferenceResult.init_point,
        preference_id: preferenceResult.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Erro processando pagamento:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
