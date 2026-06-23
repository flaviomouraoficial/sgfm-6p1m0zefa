import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { Target, ArrowRight, ArrowLeft, X } from 'lucide-react'

export function OnboardingTour() {
  const { user, isAuthenticated, loading } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const steps = useMemo(() => {
    const s = []
    s.push({
      id: 'welcome',
      title: 'Bem-vindo ao SGFM',
      content:
        'Vamos fazer um tour rápido para você conhecer a interface e se familiarizar com o sistema.',
      target: null,
    })

    s.push({
      id: 'dashboard',
      title: 'Visão Geral do Dashboard',
      content:
        'Esta é a sua área principal. Aqui você verá informações essenciais, relatórios e atalhos rápidos dependendo do seu perfil.',
      target: '[data-tour="dashboard-overview"]',
    })

    if (user?.role === 'admin' || user?.email === 'flavio@trendconsultoria.com.br') {
      s.push({
        id: 'quick-actions',
        title: 'Ações Rápidas',
        content:
          'Botões de ações rápidas, como configurar metas ou validar integridade, ficam posicionados estrategicamente aqui.',
        target: '[data-tour="quick-actions"]',
      })
    }

    s.push({
      id: 'navigation',
      title: 'Menu de Navegação',
      content: 'Use a barra lateral para acessar todos os módulos permitidos para o seu perfil.',
      target: '[data-tour="navigation"]',
    })

    s.push({
      id: 'theme-switcher',
      title: 'Personalização',
      content:
        'Você pode alternar entre os temas Claro, Escuro e Sistema. Suas preferências são salvas automaticamente.',
      target: '[data-tour="theme-switcher"]',
    })

    s.push({
      id: 'profile-settings',
      title: 'Perfil e Configurações',
      content: 'Aqui você visualiza os dados do seu perfil e pode sair do sistema com segurança.',
      target: '[data-tour="profile-settings"]',
    })

    return s
  }, [user])

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return

    if (user.preferences?.onboarding_completed !== true) {
      const t = setTimeout(() => setIsRunning(true), 1500)
      return () => clearTimeout(t)
    }
  }, [user, isAuthenticated, loading])

  const completeTour = useCallback(async () => {
    setIsRunning(false)
    if (user) {
      const prefs = user.preferences || {}
      try {
        await pb.collection('users').update(user.id, {
          preferences: { ...prefs, onboarding_completed: true },
        })
      } catch (err) {
        console.error('Failed to save onboarding preference', err)
      }
    }
  }, [user])

  useEffect(() => {
    if (!isRunning) return

    let rafId: number
    let notFoundCount = 0

    const loop = () => {
      const step = steps[currentStepIndex]
      if (step && step.target) {
        const els = Array.from(document.querySelectorAll(step.target))
        const el = els.find((e) => {
          const r = e.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        })

        if (el) {
          notFoundCount = 0
          const rect = el.getBoundingClientRect()
          setTargetRect((prev) => {
            if (!prev) return rect
            if (
              Math.abs(prev.x - rect.x) > 1 ||
              Math.abs(prev.y - rect.y) > 1 ||
              prev.width !== rect.width ||
              prev.height !== rect.height
            ) {
              return rect
            }
            return prev
          })
        } else {
          notFoundCount++
          if (notFoundCount > 60) {
            // Timeout to skip step if element is not rendered
            if (currentStepIndex < steps.length - 1) {
              setCurrentStepIndex((c) => c + 1)
              notFoundCount = 0
            } else {
              completeTour()
            }
          }
        }
      } else {
        setTargetRect(null)
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [isRunning, currentStepIndex, steps, completeTour])

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  if (!isRunning) return null

  const step = steps[currentStepIndex]

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto overflow-hidden transition-all duration-500 ease-in-out">
      {targetRect ? (
        <div
          className="absolute rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-500 ease-in-out pointer-events-none"
          style={{
            top: targetRect.y - 8,
            left: targetRect.x - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-500 pointer-events-none" />
      )}

      <div
        className={cn(
          'absolute transition-all duration-500 ease-in-out pointer-events-auto max-w-sm w-full p-4 z-[110]',
          !targetRect ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : '',
        )}
        style={
          targetRect
            ? {
                top:
                  targetRect.y + targetRect.height + 20 > window.innerHeight - 200
                    ? Math.max(16, targetRect.y - 220)
                    : targetRect.y + targetRect.height + 16,
                left: Math.max(16, Math.min(targetRect.x, window.innerWidth - 384)),
              }
            : {}
        }
      >
        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={completeTour}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Target className="w-5 h-5" />
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">{step.content}</p>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4 mt-2">
            <span className="text-xs font-medium text-muted-foreground">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="h-8 text-xs px-3"
              >
                <ArrowLeft className="w-3 h-3 mr-1" /> Anterior
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 text-xs px-3 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
                {currentStepIndex !== steps.length - 1 && <ArrowRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
