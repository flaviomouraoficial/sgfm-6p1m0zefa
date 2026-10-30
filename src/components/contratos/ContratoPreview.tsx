import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Eye } from 'lucide-react'
import { DadosContratoGeracao, construirClausulasContrato } from '@/lib/contrato-builder'
import {
  DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA,
  NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA,
} from '@/lib/contrato-verbatim-text'

interface ContratoPreviewProps {
  dados: DadosContratoGeracao
}

export function ContratoPreview({ dados }: ContratoPreviewProps) {
  const clausulas = construirClausulasContrato(dados)

  return (
    <Card className="border shadow-lg bg-white text-slate-900 font-serif">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-sans">Pré-visualização do Instrumento</CardTitle>
              <CardDescription className="text-xs font-sans">
                Renderização fiel do texto e da diagramação do contrato final
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {dados.numeroContrato}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6 text-[13px] leading-relaxed select-text">
        {/* Título */}
        <div className="text-center font-bold text-base uppercase tracking-wide">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TREINAMENTO EMPRESARIAL
        </div>

        {/* Preâmbulo */}
        <p className="text-justify">
          Pelo presente instrumento particular de prestação de serviços, de um lado, doravante
          denominada:
        </p>

        <p className="text-justify">
          <strong>CONTRATANTE:</strong> {dados.contratanteRazaoSocial || dados.contratanteNome},
          inscrita no CNPJ sob nº {dados.contratanteCnpj}, estabelecida à{' '}
          {dados.contratanteEnderecoCompleto}, em {dados.contratanteCidadeUf}, e representada
          legalmente por {dados.repContratanteNome}, {dados.repContratanteNacionalidade},{' '}
          {dados.repContratanteEstadoCivil}, {dados.repContratanteProfissao}, portador(a) do RG nº{' '}
          {dados.repContratanteRg} e CPF nº {dados.repContratanteCpf}, com e-mail para notificações:{' '}
          {dados.contratanteEmailNotificacoes}, e de outro lado, como:
        </p>

        <p className="text-justify">
          <strong>CONTRATADA:</strong> {dados.contratadaRazaoSocial || dados.contratadaNome},
          inscrita no CNPJ sob nº {dados.contratadaCnpj}, estabelecida à{' '}
          {dados.contratadaEnderecoCompleto}, em {dados.contratadaCidadeUf}, e representada
          legalmente por {dados.repContratadaNome}, {dados.repContratadaNacionalidade},{' '}
          {dados.repContratadaEstadoCivil}, {dados.repContratadaProfissao}, portador(a) do RG nº{' '}
          {dados.repContratadaRg} e CPF nº {dados.repContratadaCpf}, com e-mail para notificações:{' '}
          {dados.contratadaEmailNotificacoes}, têm, entre si, justos e acordados, quanto ao que se
          segue:
        </p>

        {/* Declaração de Destinação Empresarial */}
        <div className="p-3 bg-slate-50 border-l-2 border-slate-400 italic text-justify text-xs">
          "{DECLARACAO_DESTINACAO_EMPRESARIAL_EXATA}"
        </div>

        {/* Cláusulas */}
        {clausulas.map((c, idx) => (
          <div key={idx} className="space-y-2 pt-2">
            <p className="font-bold">
              Cláusula {c.numeroOrdinal} – {c.titulo}
            </p>

            {c.corpo.map((p, pIdx) => (
              <p key={pIdx} className="text-justify indent-6">
                {p}
              </p>
            ))}

            {/* Tabela Real da Cláusula Segunda */}
            {c.isTabela && (
              <div className="border border-slate-300 rounded my-3 overflow-hidden font-sans text-xs">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="font-bold text-slate-800">
                        Serviço/Módulo/Evento
                      </TableHead>
                      <TableHead className="font-bold text-slate-800">Data ou período</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center">
                        Carga horária
                      </TableHead>
                      <TableHead className="font-bold text-slate-800 text-center">
                        Formato
                      </TableHead>
                      <TableHead className="font-bold text-slate-800 text-center">
                        Participantes (máx.)
                      </TableHead>
                      <TableHead className="font-bold text-slate-800 text-right">
                        Valor da parcela
                      </TableHead>
                      <TableHead className="font-bold text-slate-800 text-center">
                        Vencimento
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.modulos.map((m, mIdx) => (
                      <TableRow key={mIdx}>
                        <TableCell className="font-medium">{m.servico}</TableCell>
                        <TableCell>{m.data_ou_periodo}</TableCell>
                        <TableCell className="text-center">{m.carga_horaria_horas}h</TableCell>
                        <TableCell className="text-center">{m.formato}</TableCell>
                        <TableCell className="text-center">{m.participantes_max}</TableCell>
                        <TableCell className="text-right">
                          R$ {m.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">{m.vencimento}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-slate-50 border-t-2 border-slate-300">
                      <TableCell>VALOR TOTAL</TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-center">{dados.cargaHorariaTotal}h</TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-center">—</TableCell>
                      <TableCell className="text-right text-primary">
                        R$ {dados.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Letras a), b) */}
            {c.itensLetras && (
              <div className="space-y-1 pl-6">
                {c.itensLetras.map((item, itIdx) => (
                  <p key={itIdx} className="text-justify">
                    <strong>{item.letra}</strong> {item.texto}
                  </p>
                ))}
              </div>
            )}

            {/* Parágrafos */}
            {c.paragrafos.map((p, parIdx) => (
              <p key={parIdx} className="text-justify indent-6">
                {p.titulo && <strong>{p.titulo} </strong>}
                {p.texto}
              </p>
            ))}
          </div>
        ))}

        {/* Local e Data */}
        <p className="pt-4">{dados.cidadeDataAssinatura}.</p>

        {/* Assinaturas */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold">CONTRATANTE</p>
            <p>{dados.contratanteRazaoSocial || dados.contratanteNome}</p>
            <p className="text-slate-600">Rep. Legal: {dados.repContratanteNome}</p>
          </div>
          <div className="border-t border-slate-400 pt-2">
            <p className="font-bold">CONTRATADA</p>
            <p>{dados.contratadaRazaoSocial || dados.contratadaNome}</p>
            <p className="text-slate-600">Rep. Legal: {dados.repContratadaNome}</p>
          </div>
        </div>

        {/* Testemunhas */}
        {dados.haveraTestemunhas && dados.testemunhas && dados.testemunhas.length > 0 && (
          <div className="pt-6">
            <p className="font-bold text-xs mb-4">Testemunhas:</p>
            <div className="grid grid-cols-2 gap-8 text-xs">
              {dados.testemunhas.map((t, tIdx) => (
                <div key={tIdx} className="border-t border-slate-300 pt-2">
                  <p>Nome: {t.nome || '_______________________'}</p>
                  <p>RG: {t.rg || '___________________________'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divisor de Anexo */}
        <div className="my-8 border-t-2 border-dashed border-slate-300 pt-8">
          <div className="text-center font-bold text-sm uppercase mb-3">
            ANEXO ÚNICO – PROPOSTA COMERCIAL
          </div>
          <p className="text-xs text-justify text-slate-600 mb-4">
            A proposta comercial a seguir integra o presente contrato na forma da Cláusula Terceira.
          </p>

          <div className="p-3 bg-slate-50 border rounded text-xs space-y-1 mb-4">
            <p>
              <strong>Proposta nº:</strong> {dados.anexoPropostaNumero || dados.numeroContrato} |{' '}
              <strong>Data:</strong> {dados.anexoPropostaData || dados.dataAssinaturaExtenso}
            </p>
            <p>
              <strong>Programa Contratado:</strong> {dados.anexoProgramaNome}
            </p>
            <p>
              <strong>Consultor Responsável:</strong> {dados.consultorResponsavel}
            </p>
          </div>

          {/* Lista nominal de participantes se ≤ 5 */}
          {dados.modulos.some(
            (m) =>
              m.participantes_max <= 5 &&
              m.participantes_nominais &&
              m.participantes_nominais.length > 0,
          ) && (
            <div className="p-3 border rounded bg-slate-50/50 space-y-2 text-xs">
              <p className="font-bold">Identificação Nominal de Participantes:</p>
              {dados.modulos
                .filter((m) => m.participantes_max <= 5 && m.participantes_nominais)
                .map((m, idx) => (
                  <div key={idx} className="pl-2 border-l-2 border-primary/40 space-y-1">
                    <p className="font-semibold text-slate-800">{m.servico}:</p>
                    <ul className="list-decimal list-inside pl-1 text-slate-700">
                      {m.participantes_nominais?.map((p, pIdx) => (
                        <li key={pIdx}>
                          {p.nome_completo} — CPF: {p.cpf}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              <p className="text-[11px] italic text-slate-500 pt-1">
                Nota: {NOTA_RODAPE_PARTICIPANTES_NOMINAIS_EXATA}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
