routerAdd(
  'POST',
  '/backend/v1/mentor-advisor/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      if (!body.message?.trim()) return e.badRequestError('Mensagem obrigatória')

      // Invoca o agente nativo 'mentor-advisor' registrado na migration 0094
      // A identidade e regras do PocketBase são respeitadas no escopo do usuário autenticado
      const result = $ai.agent('mentor-advisor').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: body.message,
      })

      return e.json(200, {
        conversation_id: result.conversation_id,
        content: result.content,
        citations: result.citations || [],
        message_id: result.message_id,
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Serviço de IA temporariamente indisponível' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha na execução do agente de mentoria' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'IA temporariamente indisponível' : err.message,
        })
      }
      $app.logger().error('mentor_advisor_chat: unexpected error', 'err', err.message)
      return e.json(500, { error: 'Erro interno ao processar chat do mentorando' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/mentor-advisor/chats',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const limit = parseInt(e.requestInfo().query?.limit || '20', 10) || 20
      return e.json(200, $ai.agent('mentor-advisor').listConversations({ user_id: userId, limit }))
    } catch (err) {
      $app.logger().error('mentor_advisor_chats: error listing conversations', 'err', err.message)
      return e.json(500, { error: 'Erro ao listar conversas' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/mentor-advisor/chats/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const conversationId = e.request.pathValue('conversationId')

      return e.json(
        200,
        $ai.agent('mentor-advisor').listMessages({
          conversation_id: conversationId,
          user_id: userId,
        }),
      )
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Erro ao carregar mensagens' : err.message,
        })
      }
      return e.json(500, { error: 'Erro ao carregar histórico' })
    }
  },
  $apis.requireAuth(),
)
