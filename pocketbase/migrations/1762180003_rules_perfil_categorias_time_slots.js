// Auditoria SGFM (nov/2026) — 2ª esteira, correções idempotentes (no-op em banco vazio).
// 1) API rules por perfil:
//    - v1_transactions: delete só admins (inclui admin@grupoflaviomoura.com.br)
//    - v1_recibos: gated por permissions.financeiro.recibos (+ admins)
//    - v1_contratos_treinamento: gated por permissions.crm.clientes (+ admins), delete só admins
//    - v1_empresas: leitura para autenticados, escrita só admins
// 2) Catálogo v1_settings_categorias: seed a partir das categorias distintas de
//    v1_transactions ('Recibo' normalizado para 'Recibos') + normalização do campo category.
// 3) conta_id das transações de recibo preenchido pela conta do campo banco do recibo;
//    account (texto) convertido em conta_id quando houver correspondência exata por nome.
// 4) v1_time_slots: adiciona empresa_id e preenche com a matriz (is_principal).
migrate(
  (app) => {
    const ADMIN =
      "@request.auth.role = 'admin' || @request.auth.email = 'flavio@trendconsultoria.com.br' || @request.auth.email = 'admin@grupoflaviomoura.com.br'"
    const PERM = '@request.auth.permissions.'

    const setRules = (name, rules) => {
      const col = app.findCollectionByNameOrId(name)
      let changed = false
      for (const [rule, value] of Object.entries(rules)) {
        if (col[rule] !== value) {
          col[rule] = value
          changed = true
        }
      }
      if (changed) app.save(col)
      console.log(
        '[rules-perfil] ' + name + ': ' + (changed ? 'regras atualizadas' : 'já conforme'),
      )
    }

    // ---- 1) Rules ----
    setRules('v1_transactions', {
      listRule: ADMIN + ' || ' + PERM + 'financeiro.ver_transacoes = true',
      viewRule: ADMIN + ' || ' + PERM + 'financeiro.ver_transacoes = true',
      createRule: ADMIN + ' || ' + PERM + 'financeiro.criar_editar = true',
      updateRule: ADMIN + ' || ' + PERM + 'financeiro.criar_editar = true',
      deleteRule: ADMIN,
    })
    setRules('v1_recibos', {
      listRule: ADMIN + ' || ' + PERM + 'financeiro.recibos = true',
      viewRule: ADMIN + ' || ' + PERM + 'financeiro.recibos = true',
      createRule: ADMIN + ' || ' + PERM + 'financeiro.recibos = true',
      updateRule: ADMIN + ' || ' + PERM + 'financeiro.recibos = true',
      deleteRule: ADMIN,
    })
    setRules('v1_contratos_treinamento', {
      listRule: ADMIN + ' || ' + PERM + 'crm.clientes = true',
      viewRule: ADMIN + ' || ' + PERM + 'crm.clientes = true',
      createRule: ADMIN + ' || ' + PERM + 'crm.clientes = true',
      updateRule: ADMIN + ' || ' + PERM + 'crm.clientes = true',
      deleteRule: ADMIN,
    })
    setRules('v1_empresas', {
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: ADMIN,
      updateRule: ADMIN,
      deleteRule: ADMIN,
    })

    // ---- 2) Catálogo de categorias + normalização ----
    let catSeed = 0
    let catNorm = 0
    try {
      const txs = app.findRecordsByFilter('v1_transactions', '', '-created', 500, 0)
      const meta = {} // nome normalizado -> { tipo, exemplo }
      for (const tx of txs) {
        const raw = (tx.getString('category') || '').trim()
        if (!raw) continue
        const nome = raw === 'Recibo' ? 'Recibos' : raw
        if (!meta[nome]) {
          const tipo = tx.getString('type')
          meta[nome] = tipo === 'Receita' || tipo === 'Crédito' ? 'Receita' : 'Despesa'
        }
      }
      const existentes = app.findRecordsByFilter('v1_settings_categorias', '', '-created', 500, 0)
      const porNome = {}
      for (const c of existentes) porNome[(c.getString('nome') || '').trim()] = c
      for (const [nome, tipo] of Object.entries(meta)) {
        if (porNome[nome]) continue
        const col = app.findCollectionByNameOrId('v1_settings_categorias')
        const rec = new Record(col)
        rec.set('nome', nome)
        rec.set('tipo', tipo)
        app.save(rec)
        catSeed++
      }
      // Normaliza 'Recibo' -> 'Recibos' nas transações (dedupe)
      for (const tx of txs) {
        if ((tx.getString('category') || '').trim() === 'Recibo') {
          tx.set('category', 'Recibos')
          app.save(tx)
          catNorm++
        }
      }
    } catch (err) {
      console.log('[rules-perfil] categorias: ' + (err.message || err))
    }
    console.log(
      '[rules-perfil] categorias semeadas: ' +
        catSeed +
        '; transações normalizadas Recibo->Recibos: ' +
        catNorm,
    )

    // ---- 3) conta_id de transações (recibo e account legado) ----
    let contaFromRecibo = 0
    let contaFromAccount = 0
    try {
      const contas = app.findRecordsByFilter('v1_contas_financeiras', '', '', 500, 0)
      const contaPorNome = {}
      for (const c of contas) {
        const n = (c.getString('nome') || '').trim().toLowerCase()
        if (n) contaPorNome[n] = c.id
      }
      const contaPorRecibo = {}
      const recibos = app.findRecordsByFilter('v1_recibos', '', '-created', 500, 0)
      for (const r of recibos) {
        const banco = (r.getString('banco') || '').trim().toLowerCase()
        if (banco && contaPorNome[banco]) contaPorRecibo[r.id] = contaPorNome[banco]
      }
      const txs = app.findRecordsByFilter('v1_transactions', '', '-created', 500, 0)
      for (const tx of txs) {
        const rid = tx.getString('recibo_id') || ''
        if (rid && contaPorRecibo[rid] && !tx.getString('conta_id')) {
          tx.set('conta_id', contaPorRecibo[rid])
          app.save(tx)
          contaFromRecibo++
          continue
        }
        const acct = (tx.getString('account') || '').trim().toLowerCase()
        if (acct && contaPorNome[acct] && !tx.getString('conta_id')) {
          tx.set('conta_id', contaPorNome[acct])
          app.save(tx)
          contaFromAccount++
        }
      }
    } catch (err) {
      console.log('[rules-perfil] conta_id: ' + (err.message || err))
    }
    console.log(
      '[rules-perfil] conta_id preenchida via recibo: ' +
        contaFromRecibo +
        '; via account legado: ' +
        contaFromAccount,
    )

    // ---- 4) v1_time_slots.empresa_id ----
    try {
      const col = app.findCollectionByNameOrId('v1_time_slots')
      const has = col.fields.some((f) => f.name === 'empresa_id')
      if (!has) {
        const empCol = app.findCollectionByNameOrId('v1_empresas')
        col.fields.add(
          new Field({
            type: 'relation',
            name: 'empresa_id',
            required: false,
            maxSelect: 1,
            collectionId: empCol.id,
          }),
        )
        app.save(col)
        console.log('[rules-perfil] v1_time_slots: campo empresa_id adicionado')
      }
      // Backfill: matriz is_principal para os slots existentes
      let matrizId = ''
      try {
        matrizId = app.findFirstRecordByData('v1_empresas', 'is_principal', true).id
      } catch (_) {}
      if (matrizId) {
        const slots = app.findRecordsByFilter(
          'v1_time_slots',
          "empresa_id = ''",
          '-created',
          500,
          0,
        )
        let sFix = 0
        for (const s of slots) {
          s.set('empresa_id', matrizId)
          app.save(s)
          sFix++
        }
        console.log('[rules-perfil] v1_time_slots: empresa_id preenchida (matriz) em ' + sFix)
      }
    } catch (err) {
      console.log('[rules-perfil] time_slots: ' + (err.message || err))
    }
  },
  (app) => {
    // down: no-op — dados e rules não são reversíveis com segurança
  },
)
