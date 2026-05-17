onRecordAfterCreateSuccess((e) => {
  const email = e.record.getString('cliente_email')

  if (!email) {
    return e.next()
  }

  try {
    const mentee = $app.findFirstRecordByData('v1_mentees', 'email', email)
    if (mentee) {
      const record = $app.findRecordById('v1_agendamentos', e.record.id)
      record.set('mentee_id', mentee.id)
      $app.saveNoValidate(record)
    }
  } catch (err) {
    // Mentee not found, simply skip the auto-linking
  }

  return e.next()
}, 'v1_agendamentos')
