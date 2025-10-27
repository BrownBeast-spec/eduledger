"use client"

import { Button } from "@/components/ui/button"
import { LogOut, User, Shield, GraduationCap } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Header() {
  const { user, logout } = useAuth()

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'issuer':
        return <Shield className="h-5 w-5" />
      case 'student':
        return <GraduationCap className="h-5 w-5" />
      case 'hr':
        return <User className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'issuer':
        return 'Issuer'
      case 'student':
        return 'Student'
      case 'hr':
        return 'HR'
      default:
        return 'User'
    }
  }

  if (!user) return null

  return (
    <header className="fixed top-0  left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm shadow-sm mb-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">EduLedger</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {getRoleIcon(user.role)}
              <span className="font-medium">{getRoleName(user.role)}</span>
              <span>•</span>
              <span>{user.name}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2 border-red-200 bg-red-300 hover:bg-red-400 hover:text-white-600 text-black transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
