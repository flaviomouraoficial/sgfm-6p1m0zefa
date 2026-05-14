import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface UserProfile {
  id: string
  email: string
  role: string
  name: string
  plan?: string
}

interface AuthContextType {
  user: RecordModel | null
  profile: UserProfile | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        role: 'mentee',
      })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  const profile = user
    ? {
        id: user.id,
        email: user.email,
        role: user.role || 'mentee',
        name: user.name || '',
        plan: user.plan,
      }
    : null

  return (
    <AuthContext.Provider value={{ user, profile, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
