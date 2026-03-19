import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Attachment } from '@/lib/types'
import { FileText, Image as ImageIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  attachments: Attachment[]
  onOpenChange: (open: boolean) => void
}

export function AttachmentsModal({ open, attachments, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Anexos e Documentos</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4 max-h-[300px] overflow-y-auto pr-2">
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum documento anexado.
            </p>
          ) : (
            attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-muted rounded-md shrink-0">
                    {att.type.includes('image') ? (
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate" title={att.name}>
                    {att.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a href={att.url} download={att.name} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
