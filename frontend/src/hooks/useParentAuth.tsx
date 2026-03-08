import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { portalAuthApi } from '../lib/api'
import type { PortalParent, PortalChild } from '@kindergarten/types'

interface ParentAuthContextValue {
  parent: PortalParent | null
  children: PortalChild[]
  selectedChild: PortalChild | null
  selectChild: (childId: string) => void
  token: string | null
  loading: boolean
  login: (access_code: string, pin: string) => Promise<void>
  logout: () => Promise<void>
}

const ParentAuthContext = createContext<ParentAuthContextValue | null>(null)

export function ParentAuthProvider({ children: kids }: { children: ReactNode }) {
  const [parent, setParent] = useState<PortalParent | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('portal_token'))
  const [loading, setLoading] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(() =>
    localStorage.getItem('portal_selected_child')
  )

  const childrenList = parent?.children ?? []
  const selectedChild =
    childrenList.find((c) => c.id === selectedChildId) ?? childrenList[0] ?? null

  const selectChild = useCallback((childId: string) => {
    setSelectedChildId(childId)
    localStorage.setItem('portal_selected_child', childId)
  }, [])

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
        setParent(data.data)
        setToken(stored)
      })
      .catch(() => {
        localStorage.removeItem('portal_token')
        localStorage.removeItem('portal_selected_child')
        setToken(null)
        setParent(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (access_code: string, pin: string) => {
    const { token: newToken, parent: newParent } = await portalAuthApi.login(access_code, pin)
    localStorage.setItem('portal_token', newToken)
    setToken(newToken)
    setParent(newParent)
  }, [])

  const logout = useCallback(async () => {
    try {
      await portalAuthApi.logout()
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_selected_child')
    setToken(null)
    setParent(null)
  }, [])

  return (
    <ParentAuthContext.Provider
      value={{
        parent,
        children: childrenList,
        selectedChild,
        selectChild,
        token,
        loading,
        login,
        logout,
      }}
    >
      {kids}
    </ParentAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useParentAuth(): ParentAuthContextValue {
  const ctx = useContext(ParentAuthContext)
  if (!ctx) throw new Error('useParentAuth must be used inside ParentAuthProvider')
  return ctx
}
