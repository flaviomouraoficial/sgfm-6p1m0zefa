// Garante que o cron fantasma gc_validate_once nunca volte ao agendador.
// O hook que o registrava (gc_validate_once.js) foi removido na auditoria;
// isto remove qualquer registro residual a cada boot, sem afetar os outros
// crons (monthly_closing, follow-ups etc.).
try {
  cronRemove('gc_validate_once')
  console.log('[gc-cron-cleanup] cron fantasma gc_validate_once removido do agendador')
} catch (_) {}
