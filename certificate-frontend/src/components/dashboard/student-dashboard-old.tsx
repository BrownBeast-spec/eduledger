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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Manage your certificates and consents</p>
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
                <p className="text-sm text-gray-600">Total Certificates: 0</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Portfolio
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
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
                <Input id="cert-id" placeholder="Enter certificate ID" />
              </div>
              <Button className="w-full md:w-auto">
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
                <Input id="verify-cert-id" placeholder="Enter certificate ID" />
              </div>
              <Button className="w-full md:w-auto">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
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
                  <Input id="hr-username" placeholder="Enter HR username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consent-cert-id">Certificate ID</Label>
                  <Input id="consent-cert-id" placeholder="Enter certificate ID" />
                </div>
                <Button className="w-full">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
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
                  <Input id="revoke-consent-id" placeholder="Enter consent ID" />
                </div>
                <Button variant="outline" className="w-full">
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
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
                <p className="text-sm text-gray-600">Total Consents: 0</p>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Consents
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
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
