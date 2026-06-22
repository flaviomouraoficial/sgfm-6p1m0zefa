import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PROFILE_INFO } from '@/lib/disc-data'
import { Printer } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { format } from 'date-fns'

interface DiscReportProps {
  nome: string
  empresa: string
  scores: { D: number; I: number; S: number; C: number }
  predominante: string
}

export function DiscReport({ nome, empresa, scores, predominante }: DiscReportProps) {
  const total = scores.D + scores.I + scores.S + scores.C
  const data = [
    { name: 'I (Influente)', value: Math.round((scores.I / total) * 100), color: '#3b82f6' },
    { name: 'D (Guerreiro)', value: Math.round((scores.D / total) * 100), color: '#ef4444' },
    { name: 'S (Harmonioso)', value: Math.round((scores.S / total) * 100), color: '#22c55e' },
    { name: 'C (Perfeccionista)', value: Math.round((scores.C / total) * 100), color: '#f59e0b' },
  ]

  const pInfo = PROFILE_INFO[predominante as keyof typeof PROFILE_INFO]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-0 text-slate-800">
        <div className="flex justify-end mb-4 print:hidden px-4">
          <Button onClick={handlePrint} size="lg">
            <Printer className="w-5 h-5 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>

        {/* Page 1: Capa */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] flex flex-col justify-center items-center print:shadow-none print:break-after-page relative">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-slate-900 mb-8">Assessment DISC</h1>
            <div className="w-32 h-1 bg-primary mx-auto my-8 rounded-full"></div>
            <h2 className="text-3xl font-semibold text-slate-700">
              Relatório de Perfil Comportamental
            </h2>
            <div className="mt-24 space-y-4 text-xl">
              <p>
                <strong>Nome:</strong> {nome}
              </p>
              <p>
                <strong>Empresa:</strong> {empresa}
              </p>
              <p>
                <strong>Data:</strong> {format(new Date(), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Page 2: Gráfico */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 border-b pb-4">Seu Resultado Gráfico</h2>
          <div className="h-[400px] mt-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14 }} />
                <YAxis axisLine={false} tickLine={false} unit="%" />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-semibold text-slate-700">Perfil Predominante</h3>
            <p className="text-4xl font-bold text-primary mt-4">{pInfo.title}</p>
          </div>
        </div>

        {/* Page 3: Perfil Detalhado */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 border-b pb-4">Perfil Detalhado: {pInfo.title}</h2>
          <div className="space-y-8 text-lg leading-relaxed">
            <p>{pInfo.desc}</p>

            <div>
              <h3 className="text-xl font-semibold text-primary mb-3">Principais Forças</h3>
              <ul className="list-disc pl-6 space-y-2">
                {pInfo.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-destructive mb-3">Pontos de Atenção</h3>
              <ul className="list-disc pl-6 space-y-2">
                {pInfo.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">Ambiente Ideal</h3>
              <p>{pInfo.environment}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">Estilo de Aprendizagem</h3>
              <p>{pInfo.learning}</p>
            </div>
          </div>
        </div>

        {/* Page 4: Tabela Comparativa */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 border-b pb-4">Tabela Comparativa dos Perfis</h2>
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(PROFILE_INFO).map(([key, info]) => (
              <Card
                key={key}
                className={`border-l-4 ${key === predominante ? 'border-primary shadow-md' : 'border-slate-300'}`}
              >
                <CardContent className="p-4 space-y-2 text-sm">
                  <h4 className="font-bold text-lg mb-2">{info.title}</h4>
                  <p>
                    <strong>Age de forma:</strong> {info.comparison.action}
                  </p>
                  <p>
                    <strong>Confortável com:</strong> {info.comparison.comfortable}
                  </p>
                  <p>
                    <strong>Sob estresse:</strong> {info.comparison.stress}
                  </p>
                  <p>
                    <strong>Em conflito:</strong> {info.comparison.conflict}
                  </p>
                  <p>
                    <strong>Necessita de:</strong> {info.comparison.needs}
                  </p>
                  <p>
                    <strong>Limitação:</strong> {info.comparison.limitation}
                  </p>
                  <p>
                    <strong>Mensura desempenho:</strong> {info.comparison.measures}
                  </p>
                  <p>
                    <strong>Abordagem:</strong> {info.comparison.approach}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Page 5: Relacionamentos e Comunicação */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 border-b pb-4">Comunicação e Relacionamentos</h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              Entender o seu perfil predominante <strong>{pInfo.title}</strong> é fundamental para
              melhorar sua comunicação com pessoas de perfis diferentes. Ao interagir com outras
              pessoas, você deve adaptar a sua abordagem.
            </p>
            <div className="bg-slate-50 p-6 rounded-lg space-y-4">
              <h3 className="font-bold text-xl text-primary">Dicas para o seu perfil:</h3>
              <ul className="list-disc pl-6 space-y-3">
                {predominante === 'I' && (
                  <>
                    <li>Ouça mais e fale um pouco menos. Dê espaço para os outros.</li>
                    <li>
                      Preste atenção aos detalhes quando estiver conversando com um Perfeccionista.
                    </li>
                    <li>
                      Evite ser excessivamente emotivo em situações profissionais e mantenha o foco
                      nos resultados ao interagir com Guerreiros.
                    </li>
                  </>
                )}
                {predominante === 'D' && (
                  <>
                    <li>Seja mais paciente. Nem todos operam no seu ritmo acelerado.</li>
                    <li>
                      Desenvolva empatia; pessoas Harmoniosas precisam sentir-se seguras antes de
                      agir.
                    </li>
                    <li>
                      Lembre-se de elogiar a equipe e comemorar as vitórias, algo valorizado pelos
                      Influentes.
                    </li>
                  </>
                )}
                {predominante === 'S' && (
                  <>
                    <li>
                      Seja mais direto ao expor suas ideias, especialmente ao conversar com
                      Guerreiros.
                    </li>
                    <li>
                      Aprenda a dizer "não" de maneira firme quando não puder ajudar, evitando
                      sobrecarga.
                    </li>
                    <li>Comunique-se com mais entusiasmo e energia ao interagir com Influentes.</li>
                  </>
                )}
                {predominante === 'C' && (
                  <>
                    <li>
                      Não seja tão crítico. Reconheça o esforço das pessoas antes de apontar os
                      erros.
                    </li>
                    <li>
                      Seja mais flexível com pessoas de perfil Influente, que tendem a ser mais
                      desorganizadas.
                    </li>
                    <li>
                      Tome decisões com mais rapidez, mesmo quando não possuir 100% dos dados.
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Page 6: Recomendações Práticas */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:break-after-page">
          <h2 className="text-3xl font-bold mb-8 border-b pb-4">Recomendações Práticas</h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              O autoconhecimento é o primeiro passo para o autodesenvolvimento. O perfil DISC não
              define o que você pode ou não fazer, mas indica a forma como você prefere atuar.
            </p>
            <h3 className="font-bold text-xl text-primary pt-4">
              Plano de Ação para o seu Sucesso
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 mt-1">
                  1
                </div>
                <p>
                  <strong>Maximize suas Forças:</strong> Procure envolver-se em projetos onde o
                  ponto forte seja uma vantagem competitiva natural para você.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 mt-1">
                  2
                </div>
                <p>
                  <strong>Mitigue as Limitações:</strong> Identifique as situações em que o seu
                  ponto fraco costuma prejudicá-lo e crie táticas preventivas ativamente.
                </p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 mt-1">
                  3
                </div>
                <p>
                  <strong>Busque Complementaridade:</strong> Una-se a pessoas que possuam os perfis
                  que lhe faltam. Se você é {pInfo.title}, ter um colega de perfil diferente
                  enriquecerá incrivelmente suas entregas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page 7: Fechamento */}
        <div className="bg-white p-12 shadow-lg min-h-[1056px] flex flex-col justify-center items-center text-center print:shadow-none print:break-after-page">
          <div className="max-w-2xl space-y-12">
            <h2 className="text-4xl font-serif text-slate-800 leading-snug italic">
              "As pessoas são contratadas pelas suas habilidades técnicas, mas são demitidas pelos
              seus comportamentos."
            </h2>
            <p className="text-xl text-slate-500 font-medium tracking-widest uppercase">
              — Peter Drucker
            </p>

            <div className="pt-24 border-t border-slate-200 mt-24">
              <p className="text-slate-500">Desenvolvido por</p>
              <h3 className="text-2xl font-bold text-primary mt-2">Grupo Flávio Moura</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
