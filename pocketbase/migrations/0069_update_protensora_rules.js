migrate(
  (app) => {
    const modulos = app.findCollectionByNameOrId('v1_protensora_modulos')
    modulos.listRule = "@request.auth.id != '' || @request.auth.role = 'client'"
    modulos.viewRule = "@request.auth.id != '' || @request.auth.role = 'client'"
    app.save(modulos)

    const unidades = app.findCollectionByNameOrId('v1_protensora_unidades')
    unidades.listRule = "@request.auth.id != '' || @request.auth.role = 'client'"
    unidades.viewRule = "@request.auth.id != '' || @request.auth.role = 'client'"
    app.save(unidades)
  },
  (app) => {
    const modulos = app.findCollectionByNameOrId('v1_protensora_modulos')
    modulos.listRule = "@request.auth.id != ''"
    modulos.viewRule = "@request.auth.id != ''"
    app.save(modulos)

    const unidades = app.findCollectionByNameOrId('v1_protensora_unidades')
    unidades.listRule = "@request.auth.id != ''"
    unidades.viewRule = "@request.auth.id != ''"
    app.save(unidades)
  },
)
