"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  UserPlus, 
  Users, 
  FileText, 
  Wallet, 
  Award, 
  Link as LinkIcon,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'
import { api } from '@/lib/api'

export function IssuerDashboard() {
  const [activeTab, setActiveTab] = useState('add-student')
  
  // Add Student State
  const [newStudentUsername, setNewStudentUsername] = useState('')
  const [newStudentPassword, setNewStudentPassword] = useState('')
  const [newStudentFullname, setNewStudentFullname] = useState('')
  const [addStudentResult, setAddStudentResult] = useState('')
  
  // View Students State
  const [students, setStudents] = useState([])
  const [studentsOutput, setStudentsOutput] = useState('')
  
  // Issue Certificate State
  const [certStudentName, setCertStudentName] = useState('')
  const [existingUsername, setExistingUsername] = useState('')
  const [newCertUsername, setNewCertUsername] = useState('')
  const [newCertPassword, setNewCertPassword] = useState('')
  const [course, setCourse] = useState('')
  const [grade, setGrade] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [issueCertResult, setIssueCertResult] = useState('')
  
  // Wallet State
  const [walletInfo, setWalletInfo] = useState('')
  
  // Blockchain State
  const [blockchainData, setBlockchainData] = useState('')
  
  // Auto-refresh students when tab changes to view-students
  useEffect(() => {
    if (activeTab === 'view-students') {
      viewStudents()
    }
  }, [activeTab])
  
  // View Students
  const viewStudents = async () => {
    try {
      const response = await api.getStudents()
      
      if (response.success && response.students.length > 0) {
        // Update local state
        setStudents(response.students)
        
        let output = 'All Registered Students\n'
        output += '==================================================\n\n'
        
        response.students.forEach((student: any) => {
          output += `Username: ${student.username}\n`
          output += `Name: ${student.name}\n`
          output += `Wallet: ${student.wallet_address}\n`
          output += '--------------------------------------------------\n\n'
        })
        
        setStudentsOutput(output)
      } else {
        setStudentsOutput('No students registered yet.\n\nTo add a student, use the "Add Student" tab.')
      }
    } catch (error) {
      setStudentsOutput(`Error loading students: ${error}`)
    }
  }
  
  // Add Student
  const addStudent = async () => {
    if (!newStudentUsername || !newStudentPassword || !newStudentFullname) {
      setAddStudentResult('Error: All fields are required')
      return
    }
    
    try {
      const response = await api.addStudent(newStudentUsername, newStudentPassword, newStudentFullname)
      
      if (response.success) {
        setAddStudentResult(`Student Added Successfully\n\nUsername: ${response.student.username}\nFull Name: ${response.student.name}\nWallet Address: ${response.student.wallet_address}\n\nStudent can now login with:\nUsername: ${newStudentUsername}\nPassword: ${newStudentPassword}`)
        
        // Clear form
        setNewStudentUsername('')
        setNewStudentPassword('')
        setNewStudentFullname('')
        
        // Auto-update view
        setTimeout(() => {
          viewStudents()
        }, 100)
      } else {
        setAddStudentResult(`Error: ${response.message}`)
      }
    } catch (error: any) {
      setAddStudentResult(`Error: ${error.message}`)
    }
  }
  
  // Refresh Wallet
  const refreshWallet = async () => {
    try {
      const response = await api.getIssuerWallet()
      
      if (response.success) {
        let info = 'Issuer Wallet Information\n'
        info += '==================================================\n'
        info += `Owner: ${response.wallet.owner}\n`
        info += `Address: ${response.wallet.address}\n`
        info += `Total Certificates Issued: ${response.wallet.total_issued}\n\n`
        info += 'Certificates by Student:\n'
        
        if (Object.keys(response.wallet.by_student).length > 0) {
          for (const [student, count] of Object.entries(response.wallet.by_student)) {
            info += `  - ${student}: ${count} certificate(s)\n`
          }
        } else {
          info += '  (No certificates issued yet)\n'
        }
        
        setWalletInfo(info)
      }
    } catch (error) {
      setWalletInfo(`Error loading wallet: ${error}`)
    }
  }
  
  // View Blockchain
  const viewBlockchain = async () => {
    try {
      const response = await api.getBlockchain()
      
      if (response.success) {
        let data = 'Blockchain Explorer\n'
        data += '==================================================\n'
        data += `Total Blocks: ${response.blockchain.total_blocks}\n`
        data += `Difficulty: ${response.blockchain.difficulty}\n`
        data += `Chain Valid: ${response.blockchain.valid}\n\n`
        
        for (const block of response.blockchain.blocks) {
          data += `Block #${block.index}\n`
          data += `Timestamp: ${block.timestamp}\n`
          data += `Hash: ${block.hash}\n`
          data += `Previous Hash: ${block.previous_hash}\n`
          data += `Nonce: ${block.nonce}\n`
          data += `Data Type: ${block.data_type}\n`
          
          if (block.data_type === 'certificate_issued') {
            const cert = block.data.certificate
            if (cert) {
              data += `  Certificate ID: ${cert.cert_id || 'N/A'}\n`
              data += `  Student: ${cert.student_name || 'N/A'}\n`
            }
          }
          
          data += '--------------------------------------------------\n\n'
        }
        
        setBlockchainData(data)
      }
    } catch (error) {
      setBlockchainData(`Error loading blockchain: ${error}`)
    }
  }
  
  // Issue Certificate
  const issueCertificate = async () => {
    if (!certStudentName || !course || !grade) {
      setIssueCertResult('Error: Student name, course, and grade are required')
      return
    }
    
    // Determine student username
    let studentUsername = existingUsername
    if (newCertUsername && newCertPassword) {
      // Try to create new student first
      try {
        const addStudentResponse = await api.addStudent(newCertUsername, newCertPassword, certStudentName)
        if (addStudentResponse.success) {
          studentUsername = newCertUsername
        }
      } catch (error) {
        setIssueCertResult(`Error creating student: ${error}`)
        return
      }
    }
    
    if (!studentUsername) {
      setIssueCertResult('Error: Please provide either existing student username or create new student')
      return
    }
    
    try {
      // Read PDF file if uploaded
      let pdfData = null
      if (pdfFile) {
        const fileReader = new FileReader()
        pdfData = await new Promise((resolve, reject) => {
          fileReader.onload = (e) => resolve(e.target?.result)
          fileReader.onerror = reject
          fileReader.readAsDataURL(pdfFile)
        })
      }
      
      const response = await api.issueCertificate({
        student_name: certStudentName,
        student_username: studentUsername,
        course: course,
        grade: grade,
        pdf_file: pdfData
      })
      
      if (response.success) {
        let result = `Certificate Issued Successfully\n\n`
        result += `Certificate ID: ${response.certificate_id}\n`
        result += `Student: ${certStudentName}\n`
        result += `Course: ${course}\n`
        result += `Grade: ${grade}\n`
        
        if (response.blockchain_hash) {
          result += `\nBlockchain Hash: ${response.blockchain_hash}\n`
          result += `Status: Certificate verified on blockchain\n`
        }
        
        setIssueCertResult(result)
        
        // Clear form
        setCertStudentName('')
        setExistingUsername('')
        setNewCertUsername('')
        setNewCertPassword('')
        setCourse('')
        setGrade('')
        setPdfFile(null)
      } else {
        setIssueCertResult(`Error: ${response.message || 'Failed to issue certificate'}`)
      }
    } catch (error: any) {
      setIssueCertResult(`Error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Issuer Dashboard</h1>
        <p className="text-muted-foreground">Manage students and issue certificates</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="add-student" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </TabsTrigger>
          <TabsTrigger value="view-students" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>View Students</span>
          </TabsTrigger>
          <TabsTrigger value="issue-certificate" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Issue Certificate</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="flex items-center space-x-2">
            <LinkIcon className="h-4 w-4" />
            <span>Blockchain</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add-student" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Register New Student</span>
              </CardTitle>
              <CardDescription>
                Create a new student account in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter username for student" 
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Set password"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input 
                    id="fullname" 
                    placeholder="Enter student full name"
                    value={newStudentFullname}
                    onChange={(e) => setNewStudentFullname(e.target.value)}
                  />
                </div>
              </div>
              <Button className="w-full md:w-auto" onClick={addStudent}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Student
              </Button>
              
              {addStudentResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{addStudentResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view-students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Student Directory</span>
              </CardTitle>
              <CardDescription>
                View all registered students in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Total Students: {students.length}</p>
                <Button variant="outline" size="sm" onClick={viewStudents}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh List
                </Button>
              </div>
              {studentsOutput ? (
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{studentsOutput}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No students registered yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issue-certificate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Issue New Certificate</span>
              </CardTitle>
              <CardDescription>
                Create and issue a new certificate for a student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Student Full Name</Label>
                    <Input 
                      id="student-name" 
                      placeholder="Enter student full name"
                      value={certStudentName}
                      onChange={(e) => setCertStudentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existing-username">Existing Student Username (optional)</Label>
                    <Input 
                      id="existing-username" 
                      placeholder="Leave blank for new student"
                      value={existingUsername}
                      onChange={(e) => setExistingUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">New Student Details (if applicable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">New Student Username</Label>
                    <Input 
                      id="new-username" 
                      placeholder="Enter new username"
                      value={newCertUsername}
                      onChange={(e) => setNewCertUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Student Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      placeholder="Enter new password"
                      value={newCertPassword}
                      onChange={(e) => setNewCertPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Certificate Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input 
                      id="course" 
                      placeholder="Enter course name"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input 
                      id="grade" 
                      placeholder="Enter grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">Certificate PDF (Optional)</Label>
                  <Input 
                    id="pdf-upload" 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0])}
                  />
                </div>
              </div>

              <Button className="w-full md:w-auto" onClick={issueCertificate}>
                <Award className="h-4 w-4 mr-2" />
                Issue Certificate
              </Button>
              
              {issueCertResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{issueCertResult}</pre>
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
                <span>Wallet Information</span>
              </CardTitle>
              <CardDescription>
                View your blockchain wallet details and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Wallet Details</p>
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

        <TabsContent value="blockchain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LinkIcon className="h-5 w-5" />
                <span>Blockchain Explorer</span>
              </CardTitle>
              <CardDescription>
                Explore the blockchain network and view transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Blockchain Data</p>
                <Button variant="outline" size="sm" onClick={viewBlockchain}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Blockchain
                </Button>
              </div>
              {blockchainData ? (
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">{blockchainData}</pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Blockchain data will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
