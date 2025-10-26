"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  Eye, 
  Shield, 
  Wallet, 
  RefreshCw
} from 'lucide-react'

export function HRDashboard() {
  const [activeTab, setActiveTab] = useState('verify-certificate')
  
  // State management
  const [hrVerifyCertId, setHrVerifyCertId] = useState('')
  const [verifyResult, setVerifyResult] = useState('')
  const [viewCertId, setViewCertId] = useState('')
  const [viewCertResult, setViewCertResult] = useState('')
  const [accessibleCerts, setAccessibleCerts] = useState([])
  const [walletInfo, setWalletInfo] = useState('')
  
  const verifyCertificate = async () => {
    if (!hrVerifyCertId) {
      setVerifyResult('Error: Please enter a certificate ID')
      return
    }
    setVerifyResult(`Certificate Verification\n==================================================\nCertificate ID: ${hrVerifyCertId}\nStatus: VALID\n\nCertificate verified on blockchain.`)
  }
  
  const viewCertificate = async () => {
    if (!viewCertId) {
      setViewCertResult('Error: Please enter a certificate ID')
      return
    }
    setViewCertResult(`Certificate Details\n==================================================\nCertificate ID: ${viewCertId}\nConsent Status: GRANTED\n\nCertificate Details:\nStudent: John Doe\nStudent Username: student02\nCourse: Computer Science\nGrade: A+\nBlockchain Hash: 0x1234567890abcdef`)
  }
  
  const viewAccessibleCerts = async () => {
    setAccessibleCerts(['CERT-0001'])
  }
  
  const refreshWallet = async () => {
    setWalletInfo('HR Wallet Information\n==================================================\nOwner: TechCorp HR\nAddress: 0x9876543210fedcba\nRole: Certificate Verifier')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">HR Dashboard</h1>
        <p className="text-muted-foreground">Verify and manage candidate certificates</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verify-certificate" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Verify Certificate</span>
          </TabsTrigger>
          <TabsTrigger value="view-certificate" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>View Certificate</span>
          </TabsTrigger>
          <TabsTrigger value="accessible-certificates" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Accessible Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verify-certificate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Certificate Verification</span>
              </CardTitle>
              <CardDescription>
                Verify the authenticity of a certificate using its ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hr-verify-cert-id">Certificate ID</Label>
                <Input 
                  id="hr-verify-cert-id" 
                  placeholder="Enter certificate ID"
                  value={hrVerifyCertId}
                  onChange={(e) => setHrVerifyCertId(e.target.value)}
                />
              </div>
              <Button className="w-full md:w-auto" onClick={verifyCertificate}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
              
              {verifyResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{verifyResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-certificate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Certificate Details</span>
              </CardTitle>
              <CardDescription>
                View detailed information about a certificate (requires student consent)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="view-cert-id">Certificate ID</Label>
                <Input 
                  id="view-cert-id" 
                  placeholder="Enter certificate ID"
                  value={viewCertId}
                  onChange={(e) => setViewCertId(e.target.value)}
                />
              </div>
              <Button className="w-full md:w-auto" onClick={viewCertificate}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              
              {viewCertResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{viewCertResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Certificate PDF</span>
              </CardTitle>
              <CardDescription>
                Download the certificate PDF if available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Certificate PDF will appear here when available
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessible-certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Accessible Certificates</span>
              </CardTitle>
              <CardDescription>
                View all certificates that students have granted you access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Total Accessible Certificates: {accessibleCerts.length}</p>
                <Button variant="outline" size="sm" onClick={viewAccessibleCerts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh List
                </Button>
              </div>
              {accessibleCerts.length > 0 ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground">No accessible certificates found</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No accessible certificates found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>HR Wallet</span>
              </CardTitle>
              <CardDescription>
                View your blockchain wallet information and verification capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Wallet Information</p>
                <Button variant="outline" size="sm" onClick={refreshWallet}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              {walletInfo ? (
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{walletInfo}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Wallet information will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


