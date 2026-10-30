import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2, UserCheck, Mail } from 'lucide-react'

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-muted/20 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Início
            </Button>
          </Link>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              Última atualização: Outubro de 2026
            </span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-accent">
            Política de Privacidade e Proteção de Dados (LGPD)
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Compromisso do Grupo Flávio Moura e SGFM com a transparência, segurança da informação e
            respeito à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).
          </p>
        </div>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="border-b bg-card">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              1. Identificação do Controlador
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              O <strong>Grupo Flávio Moura / Trend Consultoria</strong>, atuando como Controlador
              dos Dados Pessoais, disponibiliza esta plataforma (SGFM) para gestão financeira,
              governança de mentorias, CRM e diagnósticos corporativos.
            </p>
            <p>
              Para esclarecer dúvidas ou exercer qualquer direito relativo aos seus dados pessoais,
              nosso canal de contato com o Encarregado de Proteção de Dados (DPO) é:
            </p>
            <div className="p-3 bg-muted/40 rounded-lg border text-foreground flex items-center gap-2 text-xs">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Canal do Titular:</strong> privacidade@trendconsultoria.com.br |
                flavio@trendconsultoria.com.br
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="border-b bg-card">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              2. Dados Coletados e Finalidade do Tratamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Tratamos apenas os dados estritamente necessários para a execução contratual,
              cumprimento de obrigações legais e legítimo interesse das rotinas corporativas:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                <span className="font-semibold text-foreground text-xs block">
                  Dados Cadastrais e de Contato
                </span>
                <p className="text-xs">
                  Nome, e-mail, telefone/WhatsApp, empresa, cargo e CPF/CNPJ para identificação,
                  agendamento de reuniões e acesso às ferramentas de mentoria.
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                <span className="font-semibold text-foreground text-xs block">
                  Dados de Diagnósticos e Avaliações
                </span>
                <p className="text-xs">
                  Respostas a assessments de sucessão e testes comportamentais DISC para emissão de
                  relatórios e condução do processo de mentoria executiva.
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                <span className="font-semibold text-foreground text-xs block">
                  Dados Financeiros e Contábeis
                </span>
                <p className="text-xs">
                  Registro de recibos, faturas e lançamentos financeiros vinculados para fins de
                  auditoria, conciliação e cumprimento de obrigações fiscais brasileiras.
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border space-y-1">
                <span className="font-semibold text-foreground text-xs block">
                  Registros de Acesso e Auditoria
                </span>
                <p className="text-xs">
                  Trilha de auditoria das operações realizadas na plataforma (criação, edição e
                  exclusão) com carimbo de data/hora e identificador do usuário para integridade e
                  rastreabilidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="border-b bg-card">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              3. Direitos do Titular (Art. 18 da LGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              A qualquer momento e mediante requisição do titular ou do administrador credenciado,
              garantimos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Confirmação da existência de tratamento e acesso imediato aos dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>
                <strong>Portabilidade dos dados:</strong> exportação completa de todo o histórico
                cadastral, financeiro e de reuniões em formato legível (JSON estruturado);
              </li>
              <li>
                <strong>Anonimização ou bloqueio:</strong> desvinculação de dados pessoais
                identificadores mantendo a consistência histórica e fiscal exigida pela legislação
                contábil;
              </li>
              <li>
                Revogação do consentimento a qualquer tempo com impacto registrado no sistema.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardHeader className="border-b bg-card">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              4. Segurança da Informação e 2FA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Empregamos controles rígidos de segurança técnica e administrativa:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>
                Criptografia em trânsito (HTTPS/TLS) e isolamento por perfis de acesso no banco de
                dados;
              </li>
              <li>
                <strong>Autenticação em Duas Etapas (2FA TOTP):</strong> camada adicional de
                segurança via códigos temporários de 6 dígitos recomendada para todos os operadores
                administrativos;
              </li>
              <li>
                Trilha indelével de auditoria em transações financeiras para prevenir acessos e
                alterações indevidas;
              </li>
              <li>Servidores com monitoramento de integridade e backups automáticos.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center pt-4 pb-8 space-y-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Grupo Flávio Moura • Todos os direitos reservados.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login" className="hover:text-primary underline">
              Acessar Painel
            </Link>
            <span>•</span>
            <Link to="/agendar" className="hover:text-primary underline">
              Agendar Reunião
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
