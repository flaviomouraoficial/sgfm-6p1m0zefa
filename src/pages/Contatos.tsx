import { useState, useCallback, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { parseVCard } from '@/lib/vcard'
import { useQrScanner } from '@/hooks/use-qr-scanner'
import { getContatos, createContato, deleteContato, type Contato } from '@/services/contatos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  QrCode,
  Camera,
  CameraOff,
  Keyboard,
  Save,
  Trash2,
  Loader2,
  Search,
  RotateCcw,
  Contact as ContactIcon,
} from 'lucide-react'

type Mode = 'scanner' | 'manual'

export default function Contatos() {
  const { toast } = useToast()
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('scanner')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [scannedText, setScannedText] = useState<string>('')

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
  })

  const handleScanResult = useCallback((text: string) => {
    setScannedText(text)
    const parsed = parseVCard(text)
    setFormData({
      nome: parsed.nome,
      empresa: parsed.empresa,
      email: parsed.email,
      whatsapp: parsed.whatsapp,
    })
    setMode('manual')
  }, [])

  const { videoRef, state, error, start, stop } = useQrScanner(handleScanResult)

  useEffect(() => {
    if (state === 'error' && mode === 'scanner') {
      toast({
        title: 'Câmera Indisponível',
        description: error || 'Não foi possível acessar a câmera. Insira os dados manualmente.',
        variant: 'destructive',
      })
      setMode('manual')
    }
  }, [state, error, mode, toast])

  const fetchContatos = async (background = false) => {
    try {
      if (!background) setLoading(true)
      const data = await getContatos()
      setContatos(data)
    } catch (err) {
      // Silent fail on background
    } finally {
      if (!background) setLoading(false)
    }
  }

  useEffect(() => {
    fetchContatos()
  }, [])

  useRealtime('v1_contatos', () => fetchContatos(true))

  useEffect(() => {
    if (mode === 'scanner') {
      start()
    }
    return () => {
      stop()
    }
  }, [mode])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    try {
      await createContato({
        ...formData,
        data_captura: new Date().toISOString(),
      })
      toast({ title: 'Sucesso', description: 'Contato salvo com sucesso!' })
      setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
      setScannedText('')
      setMode('scanner')
    } catch (err) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        toast({
          title: 'Erro',
          description: getErrorMessage(err),
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContato(id)
      toast({ title: 'Excluído', description: 'Contato removido.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' })
    }
  }

  const handleManualEntry = () => {
    stop()
    setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
    setScannedText('')
    setMode('manual')
  }

  const handleResetScanner = () => {
    setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
    setScannedText('')
    setMode('scanner')
  }

  const filteredContatos = contatos.filter(
    (c) =>
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isScanning = state === 'scanning'

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            Scanner de Contatos
          </h1>
          <p className="text-muted-foreground mt-1">
            Capture contatos via QR Code (vCard) ou insira manualmente.
          </p>
        </div>
        <div className="flex gap-2">
          {mode === 'manual' && (
            <Button variant="outline" onClick={handleResetScanner}>
              <Camera className="h-4 w-4 mr-2" />
              Usar Câmera
            </Button>
          )}
          {mode === 'scanner' && (
            <Button variant="outline" onClick={handleManualEntry}>
              <Keyboard className="h-4 w-4 mr-2" />
              Inserir Manualmente
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner / Camera Section */}
        {mode === 'scanner' && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Leitor de QR Code
              </CardTitle>
              <CardDescription>
                Aponte a câmera para um QR Code contendo dados de contato (vCard).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-black border-2 border-primary/20">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-x-8 inset-y-12 border-2 border-primary/70 rounded-lg">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    </div>
                    <div className="absolute inset-x-8 top-1/2 h-0.5 bg-primary/60 animate-pulse" />
                  </div>
                )}
                {state === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/90">
                    <CameraOff className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-white text-sm font-medium mb-2">Câmera indisponível</p>
                    <p className="text-muted-foreground text-xs mb-4 max-w-xs">{error}</p>
                    <Button size="sm" variant="outline" onClick={handleManualEntry}>
                      <Keyboard className="h-4 w-4 mr-2" />
                      Inserir Manualmente
                    </Button>
                  </div>
                )}
                {state === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground text-sm">Iniciando câmera...</p>
                  </div>
                )}
              </div>
              {isScanning && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Aguardando leitura do QR Code...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ContactIcon className="h-5 w-5 text-primary" />
              {mode === 'scanner' && scannedText ? 'Contato Capturado' : 'Dados do Contato'}
            </CardTitle>
            <CardDescription>
              {mode === 'scanner'
                ? 'Revise os dados capturados antes de salvar.'
                : 'Preencha os dados do contato manualmente.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className={fieldErrors.nome ? 'border-destructive' : ''}
                  required
                />
                {fieldErrors.nome && <p className="text-sm text-destructive">{fieldErrors.nome}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  placeholder="Nome da empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  className={fieldErrors.empresa ? 'border-destructive' : ''}
                />
                {fieldErrors.empresa && (
                  <p className="text-sm text-destructive">{fieldErrors.empresa}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={fieldErrors.email ? 'border-destructive' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className={fieldErrors.whatsapp ? 'border-destructive' : ''}
                  />
                  {fieldErrors.whatsapp && (
                    <p className="text-sm text-destructive">{fieldErrors.whatsapp}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Contato
                </Button>
                {mode === 'manual' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
                      setFieldErrors({})
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Contatos Capturados</CardTitle>
              <CardDescription>
                {filteredContatos.length} {filteredContatos.length === 1 ? 'contato' : 'contatos'}{' '}
                registrado(s)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar contatos..."
                className="pl-9 bg-background w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : filteredContatos.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <ContactIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Nenhum contato encontrado</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escaneie um QR Code ou insira manualmente para começar.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto bg-background">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContatos.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{c.empresa || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell>
                        {c.whatsapp ? (
                          <Badge variant="secondary" className="font-normal">
                            {c.whatsapp}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 text-destructive transition-colors"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
