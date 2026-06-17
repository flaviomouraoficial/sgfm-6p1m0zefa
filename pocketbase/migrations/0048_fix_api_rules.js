migrate(
  (app) => {
    const saasResults = app.findCollectionByNameOrId('v1_saas_results')
    saasResults.listRule = "@request.auth.role = 'admin' || client = @request.auth.id"
    saasResults.viewRule = "@request.auth.role = 'admin' || client = @request.auth.id"
    app.save(saasResults)

    const saasDiagnostics = app.findCollectionByNameOrId('v1_saas_diagnostics')
    saasDiagnostics.listRule = "@request.auth.id != ''"
    saasDiagnostics.viewRule = "@request.auth.id != ''"
    app.save(saasDiagnostics)

    const saasQuestions = app.findCollectionByNameOrId('v1_saas_questions')
    saasQuestions.listRule = "@request.auth.id != ''"
    saasQuestions.viewRule = "@request.auth.id != ''"
    app.save(saasQuestions)

    const assessmentLinks = app.findCollectionByNameOrId('v1_assessment_links')
    assessmentLinks.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'client'"
    assessmentLinks.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'client'"
    app.save(assessmentLinks)
  },
  (app) => {},
)
