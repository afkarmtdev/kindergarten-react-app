import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: string
  email: string
  user_metadata?: { full_name?: string }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage
    if (token) {
      authApi
        .me()
        .then((u) => {
          setUser(u)
          const refreshToken = storage.getItem('refresh_token') ?? ''
          supabase.auth.setSession({ access_token: token, refresh_token: refreshToken })
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          sessionStorage.removeItem('access_token')
          sessionStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, rememberMe = false) => {
    const { user, session } = await authApi.login(email, password)
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('access_token', session.access_token)
    storage.setItem('refresh_token', session.refresh_token ?? '')
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token ?? '',
    })
    setUser(user)
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook intentionally co-located
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
