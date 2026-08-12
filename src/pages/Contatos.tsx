import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQrScanner } from '@/hooks/use-qr-scanner'
import { parseVCard } from '@/lib/vcard'
import {
  getContatos,
  createContato,
  updateContato,
  deleteContato,
  type Contato,
} from '@/services/contatos'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Camera,
  CameraOff,
  Upload,
  QrCode,
  UserPlus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  MessageSquare,
} from 'lucide-react'

export default function Contatos() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const manualInputRef = useRef<HTMLTextAreaElement>(null)

  const [contatos, setContatos] = useState<Contato[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ nome: '', empresa: '', email: '', whatsapp: '' })
  const [manualRaw, setManualRaw] = useState('')

  const handleScanResult = useCallback(
    (text: string) => {
      setManualRaw(text)
      const parsed = parseVCard(text)
      if (parsed.nome || parsed.email || parsed.whatsapp || parsed.empresa) {
        setFormData({
          nome: parsed.nome || '',
          empresa: parsed.empresa || '',
          email: parsed.email || '',
          whatsapp: parsed.whatsapp || '',
        })
        toast({
          title: 'QR Code lido com sucesso!',
          description: 'Dados do contato preenchidos no formulário.',
        })
      } else {
        toast({
          title: 'Conteúdo Lido',
          description:
            'Não foi possível extrair campos automáticos. Preencha os dados no formulário.',
        })
      }
    },
    [toast],
  )

  const {
    videoRef,
    canvasRef,
    state: cameraState,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    scanFile,
  } = useQrScanner(handleScanResult)

  const loadContatos = useCallback(async () => {
    try {
      const data = await getContatos()
      setContatos(data)
    } catch (err) {
      console.error('Erro ao carregar contatos:', err)
    }
  }, [])

  useEffect(() => {
    loadContatos()
  }, [loadContatos])

  useRealtime('v1_contatos', () => {
    loadContatos()
  })

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleProcessRaw = () => {
    if (!manualRaw.trim()) return
    const parsed = parseVCard(manualRaw)
    setFormData({
      nome: parsed.nome || formData.nome || '',
      empresa: parsed.empresa || formData.empresa || '',
      email: parsed.email || formData.email || '',
      whatsapp: parsed.whatsapp || formData.whatsapp || '',
    })
    if (parsed.nome || parsed.email || parsed.whatsapp || parsed.empresa) {
      toast({
        title: 'QR Code Processado',
        description: 'Os dados identificados foram inseridos no formulário.',
      })
    } else {
      toast({
        title: 'Aviso',
        description: 'Insira os dados do contato manualmente.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const success = await scanFile(file)
    if (!success) {
      toast({
        title: 'Falha na leitura',
        description: 'Não foi possível ler um QR Code válido na imagem fornecida.',
        variant: 'destructive',
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveContato = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      toast({
        title: 'Atenção',
        description: 'O campo Nome é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        data_captura: format(new Date(), 'yyyy-MM-dd'),
      }
      if (editingId) {
        await updateContato(editingId, payload)
        toast({ title: 'Contato atualizado com sucesso!' })
      } else {
        await createContato(payload)
        toast({ title: 'Contato salvo com sucesso!' })
      }
      setEditingId(null)
      setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
      setManualRaw('')
      loadContatos()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar contato', description: err?.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (c: Contato) => {
    setEditingId(c.id)
    setFormData({
      nome: c.nome || '',
      empresa: c.empresa || '',
      email: c.email || '',
      whatsapp: c.whatsapp || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContato(id)
      toast({ title: 'Contato removido' })
      loadContatos()
    } catch (err: any) {
      toast({ title: 'Erro ao remover contato', description: err?.message, variant: 'destructive' })
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return contatos
    return contatos.filter(
      (c) =>
        (c.nome && c.nome.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.empresa && c.empresa.toLowerCase().includes(q)) ||
        (c.whatsapp && c.whatsapp.includes(q)),
    )
  }, [contatos, search])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" /> Scanner de Contatos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Capture contatos via QR Code (vCard) ou insira manualmente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Enviar Imagem QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => manualInputRef.current?.focus()}>
            <FileText className="w-4 h-4 mr-2" /> Inserir Manualmente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" /> Leitor de QR Code
            </CardTitle>
            <CardDescription>
              Aponte a câmera para um QR Code contendo dados de contato (vCard).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-950 rounded-lg overflow-hidden relative aspect-video flex flex-col items-center justify-center p-4 text-center text-white border border-slate-800">
              <canvas ref={canvasRef} className="hidden" />
              <video
                ref={videoRef}
                className={`w-full h-full object-cover rounded ${cameraState === 'scanning' ? 'block' : 'hidden'}`}
              />

              {cameraState === 'idle' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400">A câmera está inativa.</p>
                  <Button
                    size="sm"
                    onClick={startCamera}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Camera className="w-4 h-4 mr-2" /> Ativar Câmera
                  </Button>
                </div>
              )}

              {cameraState === 'scanning' && (
                <div className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-black/20">
                  <div className="w-48 h-48 border-2 border-primary border-dashed rounded-lg animate-pulse" />
                  <Button variant="destructive" size="sm" onClick={stopCamera}>
                    <CameraOff className="w-4 h-4 mr-2" /> Desativar Câmera
                  </Button>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="flex flex-col items-center gap-2 p-2">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <p className="text-xs text-slate-300 max-w-xs">
                    {cameraError ||
                      'Câmera não disponível. Verifique se há uma câmera conectada ou utilize a entrada manual.'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={startCamera} className="mt-1">
                    <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Cole ou digite o conteúdo do QR Code aqui...
              </Label>
              <textarea
                ref={manualInputRef}
                className="w-full text-xs font-mono p-3 border rounded-md min-h-[80px] bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Cole ou digite o conteúdo do QR Code aqui..."
                value={manualRaw}
                onChange={(e) => setManualRaw(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleProcessRaw}
                  disabled={!manualRaw.trim()}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Processar QR Code
                </Button>
                {manualRaw && (
                  <Button size="sm" variant="ghost" onClick={() => setManualRaw('')}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Dados do Contato
            </CardTitle>
            <CardDescription>Preencha ou edite os dados do contato abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveContato} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do contato"
                />
              </div>

              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp / Telefone</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="w-full font-semibold" disabled={saving}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Contato' : 'Salvar Contato'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setFormData({ nome: '', empresa: '', email: '', whatsapp: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Contatos Capturados</CardTitle>
            <CardDescription>{filtered.length} contato(s) registrado(s)</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-medium">Nenhum contato encontrado</p>
              <p className="text-xs text-slate-400 mt-1">
                Escaneie um QR Code ou preencha o formulário acima.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>WhatsApp / Telefone</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.nome}</TableCell>
                      <TableCell>{c.empresa || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell>
                        {c.whatsapp ? (
                          <a
                            href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:underline"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1 text-green-600" />
                            {c.whatsapp}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.data_captura ? format(new Date(c.data_captura), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(c)}
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
