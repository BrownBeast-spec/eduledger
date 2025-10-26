package chaincode

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// Test Certificate struct creation
func TestCertificateStructure(t *testing.T) {
	cert := Certificate{
		CertificateID:       "TEST-001",
		CertificateHash:     "hash123",
		IPFSCertificateHash: "QmTest",
		IssuerDID:           "did:web:university.edu",
		StudentDID:          "did:web:student:STU001",
		StudentID:           "STU001",
		RevocationStatus:    "VALID",
		ObjectType:          "certificate",
	}

	assert.Equal(t, "TEST-001", cert.CertificateID)
	assert.Equal(t, "VALID", cert.RevocationStatus)
	assert.Equal(t, "certificate", cert.ObjectType)
}

// Test CertificateManager instantiation
func TestCertificateManagerCreation(t *testing.T) {
	cm := &CertificateManager{}
	assert.NotNil(t, cm)
}
