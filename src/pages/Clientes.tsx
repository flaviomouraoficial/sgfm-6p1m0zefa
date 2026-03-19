import { useMainStore } from '@/stores/main'
import { exportToCSV } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, User, Phone, Mail, Gift, Download, Printer } from 'lucide-react'

export default function Clientes() {
  const { clients } = useMainStore()

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Cadastro de Clientes</h1>
        <div className="flex items-center space-x-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV('clientes.csv', clients)}
            className="h-9"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {client.isB2B ? (
                      <Building2 className="w-4 h-4 text-primary" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    {client.companyName && client.companyName !== client.name && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {client.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-medium bg-muted/20">
                  {client.isB2B ? 'PJ' : 'PF'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2.5 text-xs">
                {client.phone && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 mr-2" />
                      {client.phone}
                    </div>
                    <a
                      href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 mr-2" />
                      <span className="truncate max-w-[180px]">{client.email}</span>
                    </div>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center bg-primary/5 px-1.5 py-0.5 rounded"
                    >
                      Enviar
                    </a>
                  </div>
                )}
                {client.birthday && (
                  <div className="flex items-center text-accent font-medium mt-1 pt-1">
                    <Gift className="w-3.5 h-3.5 mr-2" />
                    Nascimento:{' '}
                    {new Date(client.birthday).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                )}
              </div>

              {client.isB2B && client.contacts && client.contacts.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                    Contatos Vinculados
                  </h4>
                  <div className="space-y-2">
                    {client.contacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col text-xs bg-muted/20 p-2 rounded border border-border/30"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-foreground/90">{contact.name}</span>
                          <span className="text-[10px] bg-background px-1.5 rounded text-muted-foreground border">
                            {contact.role}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-muted-foreground hover:text-primary truncate max-w-[120px]"
                          >
                            {contact.email}
                          </a>
                          <a
                            href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:text-green-700 ml-2"
                            title="WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
