import React from 'react'
import { MeetingFormData, formatUrgencyLabel } from '@/lib/assistente-comercial-data'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react'

interface StepsProps {
  formData: MeetingFormData
  onChange: (fields: Partial<MeetingFormData>) => void
  onNext: () => void
  onPrev: () => void
  onGenerateSummary?: () => void
  validationErrors: Record<string, string>
}

// ETAPA 1
export const Step1Identification: React.FC<StepsProps> = ({
  formData,
  onChange,
  onNext,
  validationErrors,
}) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Identificação do Lead</CardTitle>
            <CardDescription>
              Dados básicos do contato e da empresa. Os campos marcados com * são obrigatórios.
            </CardDescription>
          </div>
          <Badge variant="outline">Etapa 1 de 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="leadName">Nome do lead *</Label>
            <Input
              id="leadName"
              placeholder="Ex.: Ricardo Alves Teixeira"
              value={formData.leadName}
              onChange={(e) => onChange({ leadName: e.target.value })}
              className={validationErrors.leadName ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Nome de quem conduz a conversa.</p>
            {validationErrors.leadName && (
              <p className="text-xs text-destructive">{validationErrors.leadName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa *</Label>
            <Input
              id="company"
              placeholder="Ex.: Metalúrgica Vale Verde Ltda."
              value={formData.company}
              onChange={(e) => onChange({ company: e.target.value })}
              className={validationErrors.company ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Razão social ou nome fantasia.</p>
            {validationErrors.company && (
              <p className="text-xs text-destructive">{validationErrors.company}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="segment">Segmento *</Label>
            <Select value={formData.segment} onValueChange={(val) => onChange({ segment: val })}>
              <SelectTrigger className={validationErrors.segment ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Agronegócio">Agronegócio</SelectItem>
                <SelectItem value="Varejo">Varejo</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Setor principal de atuação.</p>
            {validationErrors.segment && (
              <p className="text-xs text-destructive">{validationErrors.segment}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employees">Número de colaboradores *</Label>
            <Input
              id="employees"
              type="number"
              min="1"
              placeholder="Ex.: 120"
              value={formData.employees}
              onChange={(e) => onChange({ employees: e.target.value })}
              className={validationErrors.employees ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Total aproximado de colaboradores diretos.
            </p>
            {validationErrors.employees && (
              <p className="text-xs text-destructive">{validationErrors.employees}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tenure">Tempo de empresa *</Label>
            <Input
              id="tenure"
              placeholder="Ex.: 14 anos"
              value={formData.tenure}
              onChange={(e) => onChange({ tenure: e.target.value })}
              className={validationErrors.tenure ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Há quanto tempo a empresa opera.</p>
            {validationErrors.tenure && (
              <p className="text-xs text-destructive">{validationErrors.tenure}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channel">Canal de origem *</Label>
            <Select value={formData.channel} onValueChange={(val) => onChange({ channel: val })}>
              <SelectTrigger className={validationErrors.channel ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Indicação">Indicação</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Evento">Evento</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Por onde o lead chegou até a equipe.</p>
            {validationErrors.channel && (
              <p className="text-xs text-destructive">{validationErrors.channel}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interest">Linha de interesse *</Label>
            <Select
              value={formData.interest}
              onValueChange={(val: any) => onChange({ interest: val })}
            >
              <SelectTrigger className={validationErrors.interest ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione a linha de interesse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neomaster">Neomaster (Gestores e donos)</SelectItem>
                <SelectItem value="neoprime">Neoprime (Sucessão familiar)</SelectItem>
                <SelectItem value="indefinida">Ainda não definido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define o conjunto de produtos recomendados.
            </p>
            {validationErrors.interest && (
              <p className="text-xs text-destructive">{validationErrors.interest}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decisor">O decisor está presente? *</Label>
            <Select
              value={formData.decisor}
              onValueChange={(val: any) => onChange({ decisor: val })}
            >
              <SelectTrigger className={validationErrors.decisor ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione se o decisor está presente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sem o decisor, a proposta deve ser ajustada para a agenda conjunta.
            </p>
            {validationErrors.decisor && (
              <p className="text-xs text-destructive">{validationErrors.decisor}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="participants">Quem participa da reunião *</Label>
            <Input
              id="participants"
              placeholder="Ex.: Ricardo (sócio), Patrícia (CFO)"
              value={formData.participants}
              onChange={(e) => onChange({ participants: e.target.value })}
              className={validationErrors.participants ? 'border-destructive' : ''}
            />
            <p className="text-xs text-muted-foreground">Nomes e cargos de todos na chamada.</p>
            {validationErrors.participants && (
              <p className="text-xs text-destructive">{validationErrors.participants}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-xs text-muted-foreground">Campos obrigatórios marcados com *.</span>
          <Button type="button" onClick={onNext} className="gap-2">
            Próxima etapa <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ETAPA 2
export const Step2Qualification: React.FC<StepsProps> = ({
  formData,
  onChange,
  onNext,
  onPrev,
  validationErrors,
}) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Questionário de Qualificação</CardTitle>
            <CardDescription>
              Escolhas rápidas para questões fechadas e respostas livres para as dores do cliente.
            </CardDescription>
          </div>
          <Badge variant="outline">Etapa 2 de 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chips de Qualificação */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Faturamento anual aproximado *</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'ate1', label: 'Até 1 milhão' },
                { val: '1a5', label: '1 a 5 milhões' },
                { val: '5a20', label: '5 a 20 milhões' },
                { val: '20a50', label: '20 a 50 milhões' },
                { val: 'acima50', label: 'Acima de 50 milhões' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onChange({ revenue: chip.val as any })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.revenue === chip.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Ajuda a dimensionar o investimento possível.
            </p>
            {validationErrors.revenue && (
              <p className="text-xs text-destructive">{validationErrors.revenue}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Nível de urgência *</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'baixo', label: 'Baixo' },
                { val: 'medio', label: 'Médio' },
                { val: 'alto', label: 'Alto' },
                { val: 'critico', label: 'Crítico' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onChange({ urgency: chip.val as any })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.urgency === chip.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Quanto o problema pressiona a operação hoje.
            </p>
            {validationErrors.urgency && (
              <p className="text-xs text-destructive">{validationErrors.urgency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Já contratou consultoria ou mentoria antes? *
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'funcionou', label: 'Sim, funcionou' },
                { val: 'nao_funcionou', label: 'Sim, não funcionou' },
                { val: 'nunca', label: 'Nunca' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onChange({ history: chip.val as any })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.history === chip.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              A resposta define como tratar a objeção de "já tentei".
            </p>
            {validationErrors.history && (
              <p className="text-xs text-destructive">{validationErrors.history}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Capacidade de investimento imediato *</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'confortavel', label: 'Confortável' },
                { val: 'apertada', label: 'Apertada mas viável' },
                { val: 'sem', label: 'Sem liquidez no momento' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onChange({ liquidity: chip.val as any })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.liquidity === chip.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Liquidez real, não a intenção de investir.
            </p>
            {validationErrors.liquidity && (
              <p className="text-xs text-destructive">{validationErrors.liquidity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Prontidão emocional *</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 'aberto', label: 'Aberto e ciente do problema' },
                { val: 'reconhece', label: 'Reconhece mas desconfia' },
                { val: 'cetico', label: 'Cético' },
                { val: 'vitimista', label: 'Vitimista' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onChange({ readiness: chip.val as any })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    formData.readiness === chip.val
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Observe o tom ao falar do problema, não só o conteúdo.
            </p>
            {validationErrors.readiness && (
              <p className="text-xs text-destructive">{validationErrors.readiness}</p>
            )}
          </div>
        </div>

        {/* Textos Livres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="dorPrincipal">Qual a principal dor hoje? *</Label>
            <Textarea
              id="dorPrincipal"
              placeholder="Use as palavras do cliente."
              rows={2}
              value={formData.dorPrincipal}
              onChange={(e) => onChange({ dorPrincipal: e.target.value })}
              className={validationErrors.dorPrincipal ? 'border-destructive' : ''}
            />
            {validationErrors.dorPrincipal && (
              <p className="text-xs text-destructive">{validationErrors.dorPrincipal}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sonoFuturo">
              O que tira o seu sono quando pensa no futuro da empresa?
            </Label>
            <Textarea
              id="sonoFuturo"
              placeholder="Preocupações sobre o futuro."
              rows={2}
              value={formData.sonoFuturo}
              onChange={(e) => onChange({ sonoFuturo: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="horasOperacao">
              Quanto das suas horas semanais vai para tarefas operacionais?
            </Label>
            <Textarea
              id="horasOperacao"
              placeholder="Ex.: cerca de 60 horas por semana, quase tudo operacional."
              rows={2}
              value={formData.horasOperacao}
              onChange={(e) => onChange({ horasOperacao: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sair15Dias">
              Se você sair por 15 dias, a empresa continua crescendo ou estagna?
            </Label>
            <Textarea
              id="sair15Dias"
              placeholder="Relato da última ausência."
              rows={2}
              value={formData.sair15Dias}
              onChange={(e) => onChange({ sair15Dias: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="saidaGestor">
              Se um gestor de confiança pedir demissão amanhã, o que acontece?
            </Label>
            <Textarea
              id="saidaGestor"
              placeholder="Impacto real na operação."
              rows={2}
              value={formData.saidaGestor}
              onChange={(e) => onChange({ saidaGestor: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="custoRotatividade">
              Quanto a rotatividade e falta de tração já custaram em caixa, tempo e desgaste?
            </Label>
            <Textarea
              id="custoRotatividade"
              placeholder="Valores e tempo perdido, se citados."
              rows={2}
              value={formData.custoRotatividade}
              onChange={(e) => onChange({ custoRotatividade: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="cenario12Meses">
              O que acontece se nada mudar nos próximos 12 meses?
            </Label>
            <Textarea
              id="cenario12Meses"
              placeholder="Cenário sem mudança."
              rows={2}
              value={formData.cenario12Meses}
              onChange={(e) => onChange({ cenario12Meses: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button type="button" onClick={onNext} className="gap-2">
            Próxima etapa <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ETAPA 3
export const Step3Recommendation: React.FC<
  StepsProps & {
    productName: string
    price: number
    pains: any[]
    objections: any[]
  }
> = ({ onNext, onPrev, productName, pains, objections }) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Motor de Recomendação</CardTitle>
            <CardDescription>
              Produto, dores, objeções e roteiro calculados a partir das etapas 1 e 2.
            </CardDescription>
          </div>
          <Badge variant="outline">Etapa 3 de 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-muted/30">
            <span className="text-xs uppercase font-semibold text-muted-foreground">
              Produto Recomendado
            </span>
            <div className="text-2xl font-bold text-primary mt-1">{productName}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consulte a tabela comercial e o pitch no painel lateral.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-muted/30">
            <span className="text-xs uppercase font-semibold text-muted-foreground">
              Dores Identificadas
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">{pains.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Extraídas das falas e textos livres do lead.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Dores a serem tocadas na reunião</Label>
          <p className="text-xs text-muted-foreground">
            Use no pitch apenas as dores que o próprio cliente reconheceu ou mencionou.
          </p>
          <div className="space-y-2">
            {pains.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border-l-4 border-primary bg-muted/20 text-xs"
              >
                <span className="font-bold text-foreground">{p.t}: </span>
                <span className="text-muted-foreground">{p.d}</span>
              </div>
            ))}
            {pains.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Nenhuma dor identificada ainda.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Objeções prováveis para este perfil</Label>
          <p className="text-xs text-muted-foreground">
            Tratativas prontas no painel lateral, abertas quando a objeção surgir na conversa.
          </p>
          <div className="flex flex-wrap gap-2">
            {objections.slice(0, 5).map((o, idx) => (
              <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs">
                {o.t}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button type="button" onClick={onNext} className="gap-2">
            Próxima etapa <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ETAPA 4
export const Step4Notes: React.FC<StepsProps> = ({ formData, onChange, onNext, onPrev }) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Anotações da Conversa</CardTitle>
            <CardDescription>
              Registre durante a reunião. Números e termos do cliente ficam disponíveis para
              espelhar no pitch.
            </CardDescription>
          </div>
          <Badge variant="outline">Etapa 4 de 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="compromissos">Compromissos assumidos</Label>
            <Textarea
              id="compromissos"
              placeholder="Ex.: Enviar balanço até sexta-feira."
              rows={2}
              value={formData.compromissos}
              onChange={(e) => onChange({ compromissos: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">O que o cliente prometeu fazer.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numerosCitados">Números citados pelo cliente</Label>
            <Textarea
              id="numerosCitados"
              placeholder="Ex.: 38% do tempo em operação; folha de R$ 210 mil."
              rows={2}
              value={formData.numerosCitados}
              onChange={(e) => onChange({ numerosCitados: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Valores e percentuais, com as palavras de origem.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="termosCliente">Termos do cliente (para espelhar)</Label>
            <Textarea
              id="termosCliente"
              placeholder="Ex.: 'apagando incêndio', 'cabeça do negócio'."
              rows={2}
              value={formData.termosCliente}
              onChange={(e) => onChange({ termosCliente: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Expressões exatas que devem voltar no pitch.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="indicacoes">Indicações coletadas</Label>
            <Textarea
              id="indicacoes"
              placeholder="Ex.: Marcos Ferreira, da Associação Comercial."
              rows={2}
              value={formData.indicacoes}
              onChange={(e) => onChange({ indicacoes: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Nomes e contatos indicados pelo cliente.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proximoPasso">Próximo passo combinado</Label>
            <Input
              id="proximoPasso"
              placeholder="Ex.: Apresentar proposta ao sócio na próxima terça."
              value={formData.proximoPasso}
              onChange={(e) => onChange({ proximoPasso: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Ação concreta e responsável definido.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dataProximoContato">Data do próximo contato</Label>
            <Input
              id="dataProximoContato"
              type="date"
              value={formData.dataProximoContato}
              onChange={(e) => onChange({ dataProximoContato: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Data em que o próximo contato será feito.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button type="button" onClick={onNext} className="gap-2">
            Próxima etapa <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ETAPA 5
export const Step5Closing: React.FC<
  StepsProps & {
    summaryText: string
    onCopySummary: () => void
    onPrintSummary: () => void
    onSaveToHistory: () => void
    isSaving: boolean
  }
> = ({
  formData,
  onChange,
  onPrev,
  onGenerateSummary,
  summaryText,
  onCopySummary,
  onPrintSummary,
  onSaveToHistory,
  isSaving,
  validationErrors,
}) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Fechamento e Registro</CardTitle>
            <CardDescription>
              Registre o resultado, gere o resumo da reunião e sincronize automaticamente com o
              funil.
            </CardDescription>
          </div>
          <Badge variant="outline">Etapa 5 de 5</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="resultado">Resultado da reunião *</Label>
            <Select
              value={formData.resultado}
              onValueChange={(val) => onChange({ resultado: val })}
            >
              <SelectTrigger className={validationErrors.resultado ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fechou">Fechou</SelectItem>
                <SelectItem value="Vai pensar">Vai pensar</SelectItem>
                <SelectItem value="Objeção em aberto">Objeção em aberto</SelectItem>
                <SelectItem value="Downsell aplicado">Downsell aplicado</SelectItem>
                <SelectItem value="Não qualificado">Não qualificado</SelectItem>
                <SelectItem value="Reagendado">Reagendado</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.resultado && (
              <p className="text-xs text-destructive">{validationErrors.resultado}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condicaoEscolhida">Condição escolhida (se fechou)</Label>
            <Select
              value={formData.condicaoEscolhida}
              onValueChange={(val) => onChange({ condicaoEscolhida: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a condição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                <SelectItem value="Tabela">Tabela</SelectItem>
                <SelectItem value="Protagonista">Protagonista</SelectItem>
                <SelectItem value="Última Condição">Última Condição</SelectItem>
                <SelectItem value="Carta na Manga A">Carta na Manga A</SelectItem>
                <SelectItem value="Carta na Manga B">Carta na Manga B</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Carta na Manga somente sob autorização.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="formaPagamento">Forma de pagamento</Label>
            <Select
              value={formData.formaPagamento}
              onValueChange={(val) => onChange({ formaPagamento: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                <SelectItem value="Cartão parcelado">Cartão parcelado</SelectItem>
                <SelectItem value="Entrada e parcelas">Entrada e parcelas</SelectItem>
                <SelectItem value="Pix à vista">Pix à vista</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onPrev} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onGenerateSummary} className="gap-2">
              <FileText className="w-4 h-4" /> Gerar Resumo
            </Button>
            <Button type="button" onClick={onSaveToHistory} disabled={isSaving} className="gap-2">
              <Check className="w-4 h-4" />{' '}
              {isSaving ? 'Salvando...' : 'Salvar no Histórico & Funil'}
            </Button>
          </div>
        </div>

        {/* Resumo da Reunião */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="text-sm font-semibold">Resumo automático da reunião</Label>
              <p className="text-xs text-muted-foreground">
                Texto estruturado para colar no CRM ou enviar à equipe.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopySummary}
                className="text-xs"
              >
                Copiar Resumo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrintSummary}
                className="text-xs"
              >
                Imprimir
              </Button>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
            {summaryText ||
              'Clique em "Gerar Resumo" para visualizar o texto completo da reunião aqui.'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
