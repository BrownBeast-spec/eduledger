"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface User {
  username: string
  role: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // For now, using mock authentication
      // In production, this would call your Python backend API
      const mockUsers = {
        'issuer324': { username: 'issuer324', role: 'issuer', name: 'Institute XYZ', password: 'isse324' },
        'student02': { username: 'student02', role: 'student', name: 'John Doe', password: 'stud02' },
        'HR023': { username: 'HR023', role: 'hr', name: 'TechCorp HR', password: 'hr023' }
      }

      const userData = mockUsers[username as keyof typeof mockUsers]
      
      if (userData && userData.password === password) {
        const { password: _, ...userWithoutPassword } = userData
        setUser(userWithoutPassword)
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}