routerAdd('GET', '/backend/v1/disc/link/{token}', (e) => {
  const token = e.request.pathValue('token')
  let link
  try {
    link = $app.findFirstRecordByData('v1_disc_links', 'token', token)
  } catch (_) {
    return e.notFoundError('Link inválido ou não encontrado.')
  }

  if (!link.getBool('ativo')) {
    return e.badRequestError('Este link está desativado.')
  }

  const permitidos = link.getInt('usos_permitidos')
  const realizados = link.getInt('usos_realizados')
  if (permitidos !== -1 && realizados >= permitidos) {
    return e.badRequestError('Este link já atingiu o limite de usos.')
  }

  let empresaNome = 'Confidencial'
  const empresaId = link.getString('empresa_id')
  if (empresaId) {
    try {
      const empresa = $app.findRecordById('v1_disc_empresas', empresaId)
      empresaNome = empresa.getString('name')
    } catch (_) {}
  }

  let logoUrl = null
  try {
    const settings = $app.findFirstRecordByFilter('v1_saas_settings', '1=1')
    const logoFile = settings.getString('logo')
    if (logoFile) {
      logoUrl = `/api/files/${settings.collectionId}/${settings.id}/${logoFile}`
    }
  } catch (_) {}

  return e.json(200, {
    empresa: empresaNome,
    logoUrl,
  })
})
