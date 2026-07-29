onRecordCreate((e) => {
  if (!e.record.getString('role')) {
    e.record.set('role', 'client')
  }

  let perms = e.record.get('permissions')
  if (!perms || typeof perms !== 'object' || Object.keys(perms).length === 0) {
    e.record.set('permissions', {
      financeiro: {
        ver_transacoes: true,
        criar_editar: true,
        importar: true,
        recibos: true,
        relatorios_financeiros: true,
      },
      crm: { ver_funil: true, criar_editar_deals: true, propostas: true, clientes: true },
      mentoria: { ver_mentorados: true, sessoes: true, agenda: true },
      saas: {
        disc: true,
        assessment: true,
        360: true,
        creditos: true,
        nivel_relatorio: 'essencial',
      },
      protensora: { ver_trilhas: true, certificados: true },
      rh: { registro_ponto: true },
      biblioteca: { ver: true, editar: false },
      admin: { gerenciar_usuarios: false, configuracoes: false, perfis_acesso: false },
    })
  }

  return e.next()
}, 'users')
