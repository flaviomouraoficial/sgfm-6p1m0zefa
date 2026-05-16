import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center p-6 bg-background">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center max-w-lg shadow-sm">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-destructive font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-destructive mb-2">Ops! Algo deu errado</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error?.message || 'Ocorreu um erro inesperado ao carregar esta página.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="px-6 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md text-sm font-medium transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
