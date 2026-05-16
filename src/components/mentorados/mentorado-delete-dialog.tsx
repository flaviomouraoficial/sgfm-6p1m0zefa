import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface MentoradoDeleteDialogProps {
  mentee: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MentoradoDeleteDialog({
  mentee,
  isOpen,
  onClose,
  onSuccess,
}: MentoradoDeleteDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!mentee) return
    setLoading(true)
    try {
      await pb.collection('v1_mentees').delete(mentee.id)
      toast({ title: 'Sucesso', description: 'Mentorado excluído com sucesso.' })
      onSuccess()
      onClose()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: getErrorMessage(err),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Mentorado</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o mentorado <strong>{mentee?.name}</strong>? Esta ação
            não pode ser desfeita e todos os dados associados poderão ser perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
