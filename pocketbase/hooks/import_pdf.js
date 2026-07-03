routerAdd(
  'POST',
  '/backend/v1/import-pdf',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body || {}
    const pdfText = body.pdf_text
    const contaId = body.conta_id

    if (!pdfText || !pdfText.trim()) return e.badRequestError('pdf_text is required')
    if (!contaId) return e.badRequestError('conta_id is required')

    const systemPrompt =
      'You are a precise financial data extraction assistant. You receive raw text extracted from bank statement PDFs and must return ONLY a valid JSON array. No markdown, no code fences, no explanations.'

    const userPrompt =
      'Parse the following bank statement text and extract all transactions as a JSON array. Each object must have these exact fields:\n' +
      '- "date": in YYYY-MM-DD format (convert DD/MM/YYYY or DD/MM/YY if needed)\n' +
      '- "description": the transaction description or history text\n' +
      '- "document_number": document number if present, empty string "" otherwise\n' +
      '- "amount": numeric value as a positive number (absolute value, no currency symbols)\n' +
      '- "type": "Receita" for credits/deposits/entradas/inflows, "Despesa" for debits/withdrawals/saidas/outflows\n\n' +
      'If a line is not a transaction (e.g. headers, footers, page numbers), skip it.\n' +
      'Return ONLY the JSON array, nothing else.\n\n' +
      'Bank statement text:\n' +
      pdfText

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      let content = reply.choices[0].message.content
      content = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim()

      let transactions
      try {
        transactions = JSON.parse(content)
      } catch (parseErr) {
        return e.json(422, { error: 'Failed to parse AI response', raw: content.substring(0, 500) })
      }

      if (!Array.isArray(transactions)) {
        return e.json(422, { error: 'AI response is not an array' })
      }

      return e.json(200, { transactions })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'AI service not configured' })
      }
      if (err instanceof SkipAiError) {
        return e.json(502, { error: 'AI request failed' })
      }
      return e.internalServerError('Unexpected error during PDF processing')
    }
  },
  $apis.requireAuth(),
)
