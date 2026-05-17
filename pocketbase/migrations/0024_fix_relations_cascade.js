migrate(
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')

    const servicoField = agendamentos.fields.getByName('servico_id')
    if (servicoField) servicoField.cascadeDelete = true

    const profissionalField = agendamentos.fields.getByName('profissional_id')
    if (profissionalField) profissionalField.cascadeDelete = true

    const menteeField = agendamentos.fields.getByName('mentee_id')
    if (menteeField) menteeField.cascadeDelete = true

    app.save(agendamentos)

    const sessoes = app.findCollectionByNameOrId('v1_sessoes')
    const sessoesMenteeField = sessoes.fields.getByName('mentee_id')
    if (sessoesMenteeField) sessoesMenteeField.cascadeDelete = true
    app.save(sessoes)
  },
  (app) => {
    const agendamentos = app.findCollectionByNameOrId('v1_agendamentos')

    const servicoField = agendamentos.fields.getByName('servico_id')
    if (servicoField) servicoField.cascadeDelete = false

    const profissionalField = agendamentos.fields.getByName('profissional_id')
    if (profissionalField) profissionalField.cascadeDelete = false

    const menteeField = agendamentos.fields.getByName('mentee_id')
    if (menteeField) menteeField.cascadeDelete = false

    app.save(agendamentos)

    const sessoes = app.findCollectionByNameOrId('v1_sessoes')
    const sessoesMenteeField = sessoes.fields.getByName('mentee_id')
    if (sessoesMenteeField) sessoesMenteeField.cascadeDelete = false
    app.save(sessoes)
  },
)
