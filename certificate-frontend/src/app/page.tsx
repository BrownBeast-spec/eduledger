"use client"

import { useAuth } from "@/hooks/useAuth"
import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"
import { IssuerDashboard } from "@/components/dashboard/issuer-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { HRDashboard } from "@/components/dashboard/hr-dashboard"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'issuer':
        return <IssuerDashboard />
      case 'student':
        return <StudentDashboard />
      case 'hr':
        return <HRDashboard />
      default:
        return <div>Unknown user role</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {renderDashboard()}
      </main>
    </div>
  )
}