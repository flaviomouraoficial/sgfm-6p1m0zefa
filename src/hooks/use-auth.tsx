import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const checkIsAdmin = (user: any) => {
  if (!user) return false
  return (
    user.role === 'admin' ||
    ['flavio@trendconsultoria.com.br', 'admin@grupoflaviomoura.com.br'].includes(user.email)
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (pb.authStore.isValid && pb.authStore.record) {
          const { record } = await pb.collection('users').authRefresh()
          setUser(record)
        }
      } catch (error) {
        pb.authStore.clear()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb
        .collection('users')
        .create({ email, password, passwordConfirm: password, role: 'admin' })
      await pb.collection('users').authWithPassword(email, password)
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
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
