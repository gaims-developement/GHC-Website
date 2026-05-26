import { useMemo, useState } from 'react'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const value = useMemo(() => ({ user, setUser, isAuthenticated: Boolean(user) }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
