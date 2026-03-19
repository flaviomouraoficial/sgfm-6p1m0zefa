import { useMainStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, User, Phone, Mail, Gift } from 'lucide-react'

export default function Clientes() {
  const { clients } = useMainStore()

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Cadastro de Clientes</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id} className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {client.isB2B ? (
                      <Building2 className="w-5 h-5 text-primary" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.isB2B && <p className="text-xs text-muted-foreground">Cliente B2B</p>}
                  </div>
                </div>
                <Badge variant="outline">
                  {client.isB2B ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Phone className="w-4 h-4 mr-3" />
                  {client.phone}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Mail className="w-4 h-4 mr-3" />
                  {client.email}
                </div>
                {client.birthday && (
                  <div className="flex items-center text-accent font-medium">
                    <Gift className="w-4 h-4 mr-3" />
                    Nascimento: {new Date(client.birthday).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              {client.isB2B && client.contacts && (
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                    Contatos Vinculados
                  </h4>
                  <div className="space-y-3">
                    {client.contacts.map((contact, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded-md"
                      >
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.role}</p>
                        </div>
                        <a
                          href={`https://wa.me/${contact.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-600 hover:text-green-700"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
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
