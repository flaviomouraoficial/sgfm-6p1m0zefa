import { useState, useCallback, useEffect, useRef } from 'react'
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
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  ClipboardCheck,
  FileText,
} from 'lucide-react'

type Mode = 'scanner' | 'manual'

export default function Contatos() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('manual')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [scannedText, setScannedText] = useState<string>('')
  const [scanStatus, setScanStatus] = useState<'none' | 'success' | 'unrecognized'>('none')
  const [copied, setCopied] = useState(false)
  const [manualQrText, setManualQrText] = useState('')

  const handleCopyRaw = async () => {
    if (!scannedText) return
    try {
      await navigator.clipboard.writeText(scannedText)
      setCopied(true)
      toast({
        title: 'Copiado!',
        description: 'Conteúdo bruto copiado para a área de transferência.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto.',
        variant: 'destructive',
      })
    }
  }

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
  })

  const handleScanResult = useCallback(
    (text: string) => {
      setScannedText(text)
      const parsed = parseVCard(text)

      if (!parsed.isValid) {
        setScanStatus('unrecognized')
        toast({
          title: 'Formato Não Reconhecido',
          description: 'Formato de contato não reconhecido, por favor insira os dados manualmente.',
          variant: 'destructive',
        })
        setMode('manual')
        return
      }

      setFormData({
        nome: parsed.nome,
        empresa: parsed.empresa,
        email: parsed.email,
        whatsapp: parsed.whatsapp,
      })
      setScanStatus('success')

      toast({
        title: 'Contato Capturado!',
        description: 'Dados do contato extraídos do QR Code. Revise os campos e clique em Salvar.',
      })
      setMode('manual')
    },
    [toast],
  )

  const { videoRef, canvasRef, state, error, start, stop, scanFile } =
    useQrScanner(handleScanResult)

  useEffect(() => {
    if (state === 'error' && mode === 'scanner') {
      toast({
        title: error || 'Câmera não disponível',
        description: 'Verifique as permissões ou utilize a entrada manual abaixo.',
        variant: 'destructive',
      })
    }
  }, [state, error, mode, toast])

  const fetchContatos = async (background = false) => {
    try {
      if (!background) setLoading(true)
      const data = await getContatos()
      setContatos(data)
    } catch {
      // Silent catch on background error
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
  }, [mode, start, stop])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      setFieldErrors({ nome: 'Nome é obrigatório' })
      return
    }

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
      setScanStatus('none')
      setCopied(false)
      setManualQrText('')
      setMode('scanner')
    } catch (err) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      } else {
        toast({
          title: 'Erro ao Salvar',
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
      toast({ title: 'Excluído', description: 'Contato removido com sucesso.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir contato.', variant: 'destructive' })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast({ title: 'Processando Imagem', description: 'Lendo dados do QR Code...' })
    const success = await scanFile(file)
    if (!success) {
      toast({
        title: 'Leitura Falhou',
        description: 'Formato de contato não reconhecido, por favor insira os dados manualmente.',
        variant: 'destructive',
      })
      setScanStatus('unrecognized')
      setMode('manual')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleManualEntry = () => {
    stop()
    setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
    setScannedText('')
    setScanStatus('none')
    setCopied(false)
    setManualQrText('')
    setMode('manual')
  }

  const handleResetScanner = () => {
    setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
    setScannedText('')
    setScanStatus('none')
    setCopied(false)
    setManualQrText('')
    setMode('scanner')
  }

  const handleManualQrProcess = () => {
    const text = manualQrText.trim()
    if (!text) return
    handleScanResult(text)
    setManualQrText('')
  }

  const filteredContatos = contatos.filter(
    (c) =>
      c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const isScanning = state === 'scanning'

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Hidden offscreen canvas for QR scanning fallback */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
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
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-primary/30 hover:bg-primary/5"
          >
            <Upload className="h-4 w-4 mr-2 text-primary" />
            Enviar Imagem QR
          </Button>
          {mode === 'manual' && (
            <Button variant="outline" onClick={handleResetScanner}>
              <Camera className="h-4 w-4 mr-2" />
              Scan QR Code
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
            <CardContent className="space-y-4">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/90 overflow-y-auto">
                    <CameraOff className="h-10 w-10 text-destructive mb-3" />
                    <p className="text-white text-sm font-medium mb-1">
                      {error || 'Câmera não disponível'}
                    </p>
                    <p className="text-muted-foreground text-xs mb-3 max-w-xs">
                      Verifique as permissões ou insira o conteúdo do QR Code manualmente abaixo.
                    </p>
                    <textarea
                      className="w-full max-w-xs h-20 p-2 text-xs text-white bg-white/10 border border-white/20 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-white/40"
                      placeholder="Cole ou digite o conteúdo do QR Code aqui..."
                      value={manualQrText}
                      onChange={(e) => setManualQrText(e.target.value)}
                      aria-label="Conteúdo manual do QR Code"
                    />
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                      <Button
                        size="sm"
                        onClick={handleManualQrProcess}
                        disabled={!manualQrText.trim()}
                      >
                        Processar QR Code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Imagem
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleManualEntry}>
                        <Keyboard className="h-4 w-4 mr-2" />
                        Digitar Dados
                      </Button>
                    </div>
                  </div>
                )}
                {state === 'idle' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/50">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-white text-sm">Iniciando câmera...</p>
                  </div>
                )}
              </div>
              {isScanning && (
                <p className="text-center text-sm text-muted-foreground">
                  Aguardando leitura do QR Code...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ContactIcon className="h-5 w-5 text-primary" />
                Dados do Contato
              </span>
              {scanStatus === 'success' && (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 border-green-500/30 gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> QR Code Lido
                </Badge>
              )}
              {scanStatus === 'unrecognized' && (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 gap-1"
                >
                  <AlertCircle className="h-3.5 w-3.5" /> Entrada Manual
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {scanStatus === 'success'
                ? 'Revise os dados extraídos do QR Code antes de salvar.'
                : 'Preencha ou edite os dados do contato abaixo.'}
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
                  placeholder="Nome completo do contato"
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
                  <Label htmlFor="whatsapp">WhatsApp / Telefone</Label>
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
                    onClick={handleResetScanner}
                    title="Limpar formulário e escanear novo QR"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Novo QR
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Raw QR Text Display */}
      {scannedText && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Conteúdo bruto do QR Code
                </CardTitle>
                <CardDescription className="mt-1">
                  Texto decodificado do QR Code exatamente como lido pelo scanner.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRaw}
                className="border-primary/30 hover:bg-primary/5 w-fit"
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="h-4 w-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2 text-primary" />
                    Copiar texto
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              readOnly
              value={scannedText}
              className="w-full h-40 p-3 text-sm font-mono bg-muted/40 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 select-all"
              onClick={(e) => e.currentTarget.select()}
              aria-label="Conteúdo bruto do QR Code"
            />
          </CardContent>
        </Card>
      )}

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
                placeholder="Buscar por nome, email ou empresa..."
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
                Escaneie um QR Code, envie uma imagem de QR ou insira os dados manualmente para
                cadastrar.
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
                    <TableHead>WhatsApp / Telefone</TableHead>
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
                          title="Excluir contato"
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
