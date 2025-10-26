"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Award, 
  Download, 
  CheckCircle, 
  Shield, 
  Wallet, 
  Link as LinkIcon,
  RefreshCw,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react'

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('my-certificates')
  
  // State management
  const [downloadCertId, setDownloadCertId] = useState('')
  const [verifyCertId, setVerifyCertId] = useState('')
  const [verifyResult, setVerifyResult] = useState('')
  const [hrUsername, setHrUsername] = useState('')
  const [consentCertId, setConsentCertId] = useState('')
  const [consentResult, setConsentResult] = useState('')
  const [revokeConsentId, setRevokeConsentId] = useState('')
  const [revokeResult, setRevokeResult] = useState('')
  const [consents, setConsents] = useState([])
  const [walletInfo, setWalletInfo] = useState('')
  
  // Mock functions
  const viewCertificates = async () => {
    // Mock API call
  }
  
  const downloadPDF = async () => {
    if (!downloadCertId) return
    // Mock download
  }
  
  const verifyCertificate = async () => {
    if (!verifyCertId) {
      setVerifyResult('Error: Please enter a certificate ID')
      return
    }
    setVerifyResult(`Certificate Verification\n==================================================\nCertificate ID: ${verifyCertId}\nStatus: VALID\n\nCertificate Details:\nStudent: John Doe\nCourse: Computer Science\nGrade: A+\nBlockchain Hash: 0x1234567890abcdef`)
  }
  
  const grantConsent = async () => {
    if (!hrUsername || !consentCertId) {
      setConsentResult('Error: Please provide both HR username and certificate ID')
      return
    }
    setConsentResult(`Consent Granted Successfully\n==================================================\nHR: ${hrUsername}\nCertificate: ${consentCertId}\nStatus: ACTIVE`)
  }
  
  const revokeConsent = async () => {
    if (!revokeConsentId) {
      setRevokeResult('Error: Please enter a consent ID')
      return
    }
    setRevokeResult(`Consent Revoked Successfully\n==================================================\nConsent ID: ${revokeConsentId}\nStatus: REVOKED`)
  }
  
  const viewConsents = async () => {
    // Mock
  }
  
  const refreshWallet = async () => {
    setWalletInfo('Student Wallet Information\n==================================================\nOwner: John Doe\nUsername: student02\nAddress: 0xabcdef1234567890\nTotal Certificates Owned: 0\n\nCertificates:\n  (No certificates yet)')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Manage your certificates and consents</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-certificates" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>My Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="verify-certificate" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Verify Certificate</span>
          </TabsTrigger>
          <TabsTrigger value="manage-consents" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Manage Consents</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>My Certificate Portfolio</span>
              </CardTitle>
              <CardDescription>
                View and manage your issued certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Total Certificates: 0</p>
                <Button variant="outline" size="sm" onClick={viewCertificates}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Portfolio
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                No certificates found
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Download Certificate</span>
              </CardTitle>
              <CardDescription>
                Download a PDF copy of your certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cert-id">Certificate ID</Label>
                <Input 
                  id="cert-id" 
                  placeholder="Enter certificate ID"
                  value={downloadCertId}
                  onChange={(e) => setDownloadCertId(e.target.value)}
                />
              </div>
              <Button className="w-full md:w-auto" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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
                <Label htmlFor="verify-cert-id">Certificate ID</Label>
                <Input 
                  id="verify-cert-id" 
                  placeholder="Enter certificate ID"
                  value={verifyCertId}
                  onChange={(e) => setVerifyCertId(e.target.value)}
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

        <TabsContent value="manage-consents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Grant Access</span>
                </CardTitle>
                <CardDescription>
                  Allow HR to view your certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hr-username">HR Username</Label>
                  <Input 
                    id="hr-username" 
                    placeholder="Enter HR username"
                    value={hrUsername}
                    onChange={(e) => setHrUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consent-cert-id">Certificate ID</Label>
                  <Input 
                    id="consent-cert-id" 
                    placeholder="Enter certificate ID"
                    value={consentCertId}
                    onChange={(e) => setConsentCertId(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={grantConsent}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
                
                {consentResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{consentResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserX className="h-5 w-5" />
                  <span>Revoke Access</span>
                </CardTitle>
                <CardDescription>
                  Remove HR access to your certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="revoke-consent-id">Consent ID</Label>
                  <Input 
                    id="revoke-consent-id" 
                    placeholder="Enter consent ID"
                    value={revokeConsentId}
                    onChange={(e) => setRevokeConsentId(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full" onClick={revokeConsent}>
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
                
                {revokeResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">{revokeResult}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Active Consents</span>
              </CardTitle>
              <CardDescription>
                View all your granted consents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Total Consents: 0</p>
                <Button variant="outline" size="sm" onClick={viewConsents}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Consents
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                No consents granted yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>My Wallet</span>
              </CardTitle>
              <CardDescription>
                View your blockchain wallet information and certificate ownership
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


