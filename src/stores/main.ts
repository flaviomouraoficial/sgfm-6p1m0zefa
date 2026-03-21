import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem('gfm_auth') === 'true',
  user: JSON.parse(localStorage.getItem('gfm_user') || 'null'),
  login: (user) => {
    localStorage.setItem('gfm_auth', 'true')
    localStorage.setItem('gfm_user', JSON.stringify(user))
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    localStorage.removeItem('gfm_auth')
    localStorage.removeItem('gfm_user')
    set({ isAuthenticated: false, user: null })
  },
}))
