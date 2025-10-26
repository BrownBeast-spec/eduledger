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
  Link as LinkIcon,
  RefreshCw,
  Download
} from 'lucide-react'

export function HRDashboard() {
  const [activeTab, setActiveTab] = useState('verify-certificate')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">HR Dashboard</h1>
        <p className="text-gray-600">Verify and manage candidate certificates</p>
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
                <Input id="hr-verify-cert-id" placeholder="Enter certificate ID" />
              </div>
              <Button className="w-full md:w-auto">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
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
                <Input id="view-cert-id" placeholder="Enter certificate ID" />
              </div>
              <Button className="w-full md:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Certificate PDF</span>
              </CardTitle>
              <CardDescription>
                Download the certificate PDF if available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
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
                <p className="text-sm text-gray-600">Total Accessible Certificates: 0</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh List
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                No accessible certificates found
              </div>
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
                <p className="text-sm text-gray-600">Wallet Information</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                Wallet information will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
