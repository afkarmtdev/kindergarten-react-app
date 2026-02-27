import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  user_metadata?: { full_name?: string }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user, session } = await authApi.login(email, password)
    localStorage.setItem('access_token', session.access_token)
    setUser(user)
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
