import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-4">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-muted-foreground">Página não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          Desculpe, não conseguimos encontrar a página que você está procurando. Verifique o
          endereço e tente novamente.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Voltar para o Início</Link>
        </Button>
      </div>
    </div>
  )
}
