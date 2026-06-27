import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const checkIsAdmin = (user: any) => {
  if (!user) return false
  return user.role === 'admin' || user.email === 'flavio@trendconsultoria.com.br'
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let isRefreshing = false

    const syncAuth = async () => {
      if (pb.authStore.isValid) {
        isRefreshing = true
        try {
          const { record } = await pb.collection('users').authRefresh()
          if (isMounted) {
            setUser(record)
            setIsAuthenticated(true)
          }
        } catch (error: any) {
          if (isMounted) {
            pb.authStore.clear()
            setUser(null)
            setIsAuthenticated(false)
            // Redirects are handled by AuthGuard components listening to valid state
          }
        } finally {
          isRefreshing = false
          if (isMounted) setLoading(false)
        }
      } else {
        if (pb.authStore.record) pb.authStore.clear()
        if (isMounted) {
          setUser(null)
          setIsAuthenticated(false)
          setLoading(false)
        }
      }
    }

    syncAuth()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (isMounted && !isRefreshing) {
        setUser(pb.authStore.isValid ? record : null)
        setIsAuthenticated(pb.authStore.isValid)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        role: 'client',
        permissions: {
          saas_access: true,
          buy_credits: true,
        },
      })
      await pb.collection('users').authWithPassword(email, password)
      setIsAuthenticated(true)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      const { record } = await pb.collection('users').authRefresh()
      setUser(record)
      setIsAuthenticated(true)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
