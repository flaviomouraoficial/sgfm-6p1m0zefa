onRecordCreate((e) => {
  const record = e.record
  const currentNum = record.getString('numero')

  // Se já tem numeração customizada ou gerada, ignora.
  if (currentNum && currentNum.startsWith('REC-') && currentNum !== 'PENDING') {
    return e.next()
  }

  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`

  try {
    const result = $app.findRecordsByFilter('v1_recibos', `numero ~ '${prefix}'`, '-numero', 1, 0)
    let nextSeq = 1

    if (result && result.length > 0) {
      const lastNum = result[0].getString('numero')
      const parts = lastNum.split('-')
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10)
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1
        }
      }
    }

    const numero = prefix + String(nextSeq).padStart(5, '0')
    record.set('numero', numero)
  } catch (err) {
    const numero = prefix + '00001'
    record.set('numero', numero)
  }

  return e.next()
}, 'v1_recibos')
