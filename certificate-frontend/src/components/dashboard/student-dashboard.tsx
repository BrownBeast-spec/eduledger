"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my-certificates')
  
  // State management
  const [certificates, setCertificates] = useState([])
  const [downloadCertId, setDownloadCertId] = useState('')
  const [verifyCertId, setVerifyCertId] = useState('')
  const [verifyResult, setVerifyResult] = useState('')
  const [hrUsername, setHrUsername] = useState('HR023')
  const [consentCertId, setConsentCertId] = useState('')
  const [consentResult, setConsentResult] = useState('')
  const [revokeConsentId, setRevokeConsentId] = useState('')
  const [revokeResult, setRevokeResult] = useState('')
  const [consents, setConsents] = useState([])
  const [walletInfo, setWalletInfo] = useState('')
  
  // Fetch certificates
  const viewCertificates = async () => {
    if (!user) return
    
    try {
      const response = await api.getStudentCertificates(user.username)
      
      if (response.success) {
        setCertificates(response.certificates || [])
      }
    } catch (error: any) {
      console.error('Error fetching certificates:', error)
    }
  }
  
  const downloadPDF = async (certId?: string | any) => {
    // Ensure we have a string certificate ID
    let certIdToUse: string
    
    if (typeof certId === 'string') {
      certIdToUse = certId
    } else if (typeof downloadCertId === 'string') {
      certIdToUse = downloadCertId
    } else {
      alert('Please enter a certificate ID')
      return
    }
    
    if (!certIdToUse) {
      alert('Please enter a certificate ID')
      return
    }
    
    try {
      // Check if certificate has PDF
      const response = await api.verifyCertificate(certIdToUse)
      
      if (response.success && response.certificate) {
        // Check if PDF is available
        if (!response.certificate.pdf_file_path && !response.certificate.ipfs_hash) {
          alert('PDF not available for this certificate. The certificate was issued without a PDF upload.')
          return
        }
        
        // Get download URL and trigger download directly
        const downloadUrl = api.downloadCertificate(certIdToUse)
        
        // Open download URL in new tab
        const link = document.createElement('a')
        link.href = downloadUrl
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Certificate not found')
      }
    } catch (error: any) {
      console.error('Download error:', error)
      const errorMsg = error?.message || 'Unknown error occurred'
      alert(`Error: ${errorMsg}`)
    }
  }
  
  const verifyCertificate = async () => {
    if (!verifyCertId) {
      setVerifyResult('Error: Please enter a certificate ID')
      return
    }
    
    try {
      const response = await api.verifyCertificate(verifyCertId)
      
      if (response.success) {
        let result = 'Certificate Verification\n'
        result += '==================================================\n'
        result += `Certificate ID: ${verifyCertId}\n`
        result += `Status: ${response.valid ? 'VALID' : 'INVALID'}\n`
        result += `Message: ${response.message}\n\n`
        
        if (response.valid && response.certificate) {
          result += 'Certificate Details:\n'
          result += `Student: ${response.certificate.student_name}\n`
          result += `Course: ${response.certificate.course}\n`
          result += `Grade: ${response.certificate.grade}\n`
          result += `Blockchain Hash: ${response.certificate.blockchain_hash || 'N/A'}\n`
          
          if (response.certificate.signatures && response.certificate.signatures.length > 0) {
            result += '\nSignatures:\n'
            response.certificate.signatures.forEach((sig: any) => {
              result += `  - ${sig.signer}: ${sig.signature}\n`
            })
          }
        }
        
        setVerifyResult(result)
      }
    } catch (error: any) {
      setVerifyResult(`Error: ${error.message}`)
    }
  }
  
  const grantConsent = async () => {
    if (!hrUsername || !consentCertId) {
      setConsentResult('Error: Please provide both HR username and certificate ID')
      return
    }
    
    if (!user) {
      setConsentResult('Error: Not logged in')
      return
    }
    
    try {
      const response = await api.grantConsent({
        student_username: user.username,
        hr_username: hrUsername,
        certificate_id: consentCertId
      })
      
      if (response.success) {
        let result = 'Consent Granted Successfully\n'
        result += '==================================================\n'
        result += `Consent ID: ${response.consent_id}\n`
        result += `HR: ${hrUsername}\n`
        result += `Certificate: ${consentCertId}\n`
        result += 'Status: ACTIVE\n'
        
        setConsentResult(result)
        
        // Clear form
        setConsentCertId('')
        
        // Refresh consents
        viewConsents()
      }
    } catch (error: any) {
      setConsentResult(`Error: ${error.message}`)
    }
  }
  
  const revokeConsent = async () => {
    if (!revokeConsentId) {
      setRevokeResult('Error: Please enter a consent ID')
      return
    }
    
    if (!user) {
      setRevokeResult('Error: Not logged in')
      return
    }
    
    try {
      const response = await api.revokeConsent({
        student_username: user.username,
        consent_id: revokeConsentId
      })
      
      if (response.success) {
        let result = 'Consent Revoked Successfully\n'
        result += '==================================================\n'
        result += `Consent ID: ${revokeConsentId}\n`
        result += 'Status: REVOKED\n'
        
        setRevokeResult(result)
        
        // Clear form
        setRevokeConsentId('')
        
        // Refresh consents
        viewConsents()
      }
    } catch (error: any) {
      setRevokeResult(`Error: ${error.message}`)
    }
  }
  
  const viewConsents = async () => {
    if (!user) return
    
    try {
      const response = await api.getConsents(user.username)
      
      if (response.success) {
        setConsents(response.consents || [])
      }
    } catch (error: any) {
      console.error('Error fetching consents:', error)
    }
  }
  
  const refreshWallet = async () => {
    if (!user) return
    
    try {
      // Get wallet address from system
      let info = 'Student Wallet Information\n'
      info += '==================================================\n'
      info += `Owner: ${user.name}\n`
      info += `Username: ${user.username}\n`
      
      // Get certificates
      const response = await api.getStudentCertificates(user.username)
      if (response.success) {
        const certs = response.certificates || []
        info += `Total Certificates Owned: ${certs.length}\n\n`
        info += 'Certificates:\n'
        
        if (certs.length > 0) {
          certs.forEach((cert: any) => {
            info += `  - ${cert.cert_id}: ${cert.course} (${cert.grade})\n`
          })
        } else {
          info += '  (No certificates yet)\n'
        }
      }
      
      setWalletInfo(info)
    } catch (error: any) {
      setWalletInfo(`Error: ${error.message}`)
    }
  }

  // Auto-load data when tab changes
  useEffect(() => {
    if (!user) return
    
    if (activeTab === 'my-certificates') {
      viewCertificates()
    } else if (activeTab === 'manage-consents') {
      viewConsents()
    } else if (activeTab === 'wallet') {
      refreshWallet()
    }
  }, [activeTab, user])

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex w-full">
        <div className="w-64 border-r border-border bg-card p-4 pt-40 shrink-0 fixed h-full mt-14">
          <TabsList className="flex flex-col space-y-8">
            <TabsTrigger value="my-certificates" className={`w-full flex items-center space-x-2 justify-start px-3 py-2 ${activeTab === 'my-certificates' ? 'bg-accent' : ''}`}>
              <Award className="h-4 w-4" />
              <span>My Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="verify-certificate" className={`w-full flex items-center space-x-2 justify-start px-3 py-2 ${activeTab === 'verify-certificate' ? 'bg-accent' : ''}`}>
              <CheckCircle className="h-4 w-4" />
              <span>Verify Certificate</span>
            </TabsTrigger>
            <TabsTrigger value="manage-consents" className={`w-full flex items-center space-x-2 justify-start px-3 py-2 ${activeTab === 'manage-consents' ? 'bg-accent' : ''}`}>
              <Shield className="h-4 w-4" />
              <span>Manage Consents</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className={`w-full flex items-center space-x-2 justify-start px-3 py-2 ${activeTab === 'wallet' ? 'bg-accent' : ''}`}>
              <Wallet className="h-4 w-4" />
              <span>Wallet</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 mt-12 ml-64">
         

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
                  <p className="text-sm text-muted-foreground">Total Certificates: {certificates.length}</p>
                  <Button variant="outline" size="sm" onClick={viewCertificates}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Portfolio
                  </Button>
                </div>
                {certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert: any) => (
                      <Card key={cert.cert_id} className="border">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-lg">{cert.cert_id}</h4>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadPDF(cert.cert_id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                            <p className="text-sm"><span className="font-medium">Course:</span> {cert.course}</p>
                            <p className="text-sm"><span className="font-medium">Grade:</span> {cert.grade}</p>
                            <p className="text-sm"><span className="font-medium">Issue Date:</span> {cert.issue_date}</p>
                            <p className="text-sm"><span className="font-medium">Issuer:</span> {cert.issuer}</p>
                            {cert.blockchain_hash && (
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                Hash: {cert.blockchain_hash}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No certificates found
                  </div>
                )}
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
                <Button className="w-full md:w-auto" onClick={() => downloadPDF()}>
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
                  <p className="text-sm text-muted-foreground">Total Consents: {consents.length}</p>
                  <Button variant="outline" size="sm" onClick={viewConsents}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Consents
                  </Button>
                </div>
                {consents.length > 0 ? (
                  <div className="space-y-4">
                    {consents.map((consent: any) => (
                      <Card key={consent.consent_id} className="border">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg">{consent.consent_id}</h4>
                            <p className="text-sm"><span className="font-medium">HR:</span> {consent.hr}</p>
                            <p className="text-sm"><span className="font-medium">Certificate:</span> {consent.cert_id}</p>
                            <p className="text-sm"><span className="font-medium">Status:</span> <span className={consent.status === 'active' ? 'text-green-600' : 'text-red-600'}>{consent.status.toUpperCase()}</span></p>
                            <p className="text-sm"><span className="font-medium">Granted:</span> {new Date(consent.granted_at).toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No consents granted yet
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
        </div>
      </Tabs>
    </div>
  )
}


