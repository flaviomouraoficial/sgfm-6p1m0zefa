import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').trim()
  const supabaseKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim()

  const supabase = createClient(supabaseUrl, supabaseKey)

  let topic: string | null = null
  let id: string | null = null
  let body: any = null

  try {
    const url = new URL(req.url)
    topic = url.searchParams.get('topic') || url.searchParams.get('type')
    id = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (req.method === 'POST') {
      body = await req.json().catch(() => null)
      if (body) {
        if (!topic && body.type) topic = body.type
        if (!id && body.data?.id) id = body.data.id
      }
    }

    if (topic === 'payment' && id) {
      const mpAccessToken = (Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '').trim()

      if (!mpAccessToken) {
        console.error('CRÍTICO: MERCADO_PAGO_ACCESS_TOKEN ausente no webhook.')
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      })

      const paymentData = await mpResponse.json()

      // Registrar log imediato do payload para facilitar debugging (especialmente Pix)
      await supabase.from('webhook_logs').insert({
        id_mercado_pago: String(id),
        status_pagamento: paymentData.status || 'unknown',
        dados_recebidos: paymentData,
        erro: null,
      })

      if (paymentData.status === 'approved') {
        const external_reference = paymentData.external_reference
        const preference_id = paymentData.preference_id

        let query = supabase.from('transacoes_pagamento').select('*')

        if (external_reference) {
          // A external_reference deve ser nosso transacao.id (UUID). Validamos o formato.
          const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
          if (uuidRegex.test(external_reference)) {
            query = query.eq('id', external_reference)
          } else {
            query = query.eq('id_mercado_pago', preference_id)
          }
        } else if (preference_id) {
          // Fallback para buscar pela preference_id
          query = query.eq('id_mercado_pago', preference_id)
        } else {
          throw new Error('Pagamento aprovado recebido sem external_reference ou preference_id')
        }

        const { data: transacao } = await query.maybeSingle()

        if (transacao && transacao.status_pagamento !== 'approved') {
          const paymentMethodId = paymentData.payment_method_id || 'unknown' // ex: 'pix'

          // Atualizar transação como aprovada
          await supabase
            .from('transacoes_pagamento')
            .update({
              status_pagamento: 'approved',
              metodo_pagamento: paymentMethodId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', transacao.id)

          const { data: plano } = await supabase
            .from('pacotes_creditos')
            .select('nome, quantidade_creditos')
            .eq('id', transacao.pacote_id)
            .maybeSingle()

          if (plano) {
            const usuario_id = transacao.usuario_id

            // 1. Atualizar Saldo do Usuário
            const { data: saldo } = await supabase
              .from('saldo_usuario')
              .select('*')
              .eq('usuario_id', usuario_id)
              .maybeSingle()

            if (saldo) {
              await supabase
                .from('saldo_usuario')
                .update({
                  creditos_disponiveis:
                    (saldo.creditos_disponiveis || 0) + plano.quantidade_creditos,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', saldo.id)
            } else {
              await supabase
                .from('saldo_usuario')
                .insert({ usuario_id, creditos_disponiveis: plano.quantidade_creditos })
            }

            // 2. Inserir no Histórico de Compras
            await supabase.from('historico_compras').insert({
              usuario_id,
              transacao_id: transacao.id,
              pacote_nome: plano.nome,
              valor_compra: transacao.valor_pago,
              creditos_adquiridos: plano.quantidade_creditos,
              status: 'concluido',
            })

            // 3. Atualizar créditos no Profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('credits')
              .eq('id', usuario_id)
              .maybeSingle()

            if (profile) {
              await supabase
                .from('profiles')
                .update({ credits: (profile.credits || 0) + plano.quantidade_creditos })
                .eq('id', usuario_id)
            }
          }
        }
      }
    } else {
      // Registrar log para outros eventos (pings, merchant_order, etc)
      await supabase.from('webhook_logs').insert({
        id_mercado_pago: id ? String(id) : null,
        status_pagamento: topic || 'unknown',
        dados_recebidos: body || {},
        erro: null,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    await supabase.from('webhook_logs').insert({
      id_mercado_pago: id ? String(id) : null,
      status_pagamento: topic || 'error',
      dados_recebidos: body || {},
      erro: error.message || 'Unknown error',
    })

    // Retornamos 200 mesmo em caso de erro interno para que o Mercado Pago não realize retentativas infinitas
    // ou desabilite o endpoint. O erro já está devidamente registrado na tabela webhook_logs.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
