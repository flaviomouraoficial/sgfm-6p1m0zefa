migrate(
  (app) => {
    const collection = new Collection({
      name: 'v1_recibos',
      type: 'base',
      listRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      viewRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      createRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      updateRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      deleteRule:
        "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br'",
      fields: [
        { name: 'numero', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Receber', 'Pagar'],
          maxSelect: 1,
        },
        { name: 'status', type: 'text', required: false },
        { name: 'data_criacao', type: 'date', required: true },
        { name: 'cliente_nome', type: 'text', required: true },
        { name: 'cliente_documento', type: 'text', required: false },
        { name: 'nf_numero', type: 'text', required: false },
        { name: 'nf_data', type: 'date', required: false },
        { name: 'nf_descricao', type: 'text', required: false },
        { name: 'nf_valor_total', type: 'number', required: false },
        { name: 'banco', type: 'text', required: false },
        { name: 'agencia_conta', type: 'text', required: false },
        { name: 'itens', type: 'json', required: false },
        { name: 'subtotal', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_recibos_numero ON v1_recibos (numero)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('v1_recibos')
    app.delete(collection)
  },
)
