import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { portalAuthApi } from '../lib/api'

interface PortalStudent {
  id: string
  full_name: string
  class_name?: string | null
  photo_url?: string
}

interface ParentAuthContextValue {
  student: PortalStudent | null
  token: string | null
  loading: boolean
  login: (access_code: string, pin: string) => Promise<void>
  logout: () => Promise<void>
}

const ParentAuthContext = createContext<ParentAuthContextValue | null>(null)

export function ParentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<PortalStudent | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('portal_token'))
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('portal_token')
    if (!stored) {
      setLoading(false)
      return
    }

    portalAuthApi
      .me()
      .then((data) => {
        setStudent(data.data)
        setToken(stored)
      })
      .catch(() => {
        localStorage.removeItem('portal_token')
        setToken(null)
        setStudent(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (access_code: string, pin: string) => {
    const { token: newToken, student: newStudent } = await portalAuthApi.login(access_code, pin)
    localStorage.setItem('portal_token', newToken)
    setToken(newToken)
    setStudent(newStudent)
  }, [])

  const logout = useCallback(async () => {
    try {
      await portalAuthApi.logout()
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('portal_token')
    setToken(null)
    setStudent(null)
  }, [])

  return (
    <ParentAuthContext.Provider value={{ student, token, loading, login, logout }}>
      {children}
    </ParentAuthContext.Provider>
  )
}

export function useParentAuth(): ParentAuthContextValue {
  const ctx = useContext(ParentAuthContext)
  if (!ctx) throw new Error('useParentAuth must be used inside ParentAuthProvider')
  return ctx
}
