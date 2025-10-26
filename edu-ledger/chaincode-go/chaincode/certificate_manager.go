/*
Copyright 2024 University Certificate Management System

SPDX-License-Identifier: Apache-2.0
*/

package chaincode

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// CertificateManager manages academic certificates
type CertificateManager struct {
	contractapi.Contract
}

// Certificate represents an academic certificate on the blockchain
type Certificate struct {
	CertificateID       string                 `json:"certificateID"`
	CertificateHash     string                 `json:"certificateHash"`
	IPFSCertificateHash string                 `json:"ipfsCertificateHash"`
	IssuerDID           string                 `json:"issuerDID"`
	StudentDID          string                 `json:"studentDID"`
	StudentID           string                 `json:"studentID"`
	IssuanceDate        string                 `json:"issuanceDate"` // RFC3339 format
	RevocationStatus    string                 `json:"revocationStatus"` // VALID, REVOKED
	RevocationDate      string                 `json:"revocationDate"`
	RevocationReason    string                 `json:"revocationReason"`
	Metadata            map[string]interface{} `json:"metadata"`
	ObjectType          string                 `json:"objectType"`
}

// IssueCertificate creates a new certificate on the blockchain
func (cm *CertificateManager) IssueCertificate(
	ctx contractapi.TransactionContextInterface,
	certificateID string,
	certificateHash string,
	ipfsCertificateHash string,
	issuerDID string,
	studentDID string,
	studentID string,
	metadataJSON string,
) error {
	// Verify caller is authorized issuer
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only University MSP (Org1) can issue certificates
	if clientMSPID != "Org1MSP" {
		return fmt.Errorf("unauthorized: only university can issue certificates")
	}

	// Check if certificate already exists
	existingCert, err := ctx.GetStub().GetState(certificateID)
	if err != nil {
		return fmt.Errorf("failed to read certificate: %v", err)
	}
	if existingCert != nil {
		return fmt.Errorf("certificate %s already exists", certificateID)
	}

	// Parse metadata
	var metadata map[string]interface{}
	err = json.Unmarshal([]byte(metadataJSON), &metadata)
	if err != nil {
		return fmt.Errorf("failed to unmarshal metadata: %v", err)
	}

	// Create certificate
	certificate := Certificate{
		CertificateID:       certificateID,
		CertificateHash:     certificateHash,
		IPFSCertificateHash: ipfsCertificateHash,
		IssuerDID:           issuerDID,
		StudentDID:          studentDID,
		StudentID:           studentID,
		IssuanceDate:        time.Now().Format(time.RFC3339),
		RevocationStatus:    "VALID",
		Metadata:            metadata,
		ObjectType:          "certificate",
	}

	// Marshal certificate to JSON
	certificateJSON, err := json.Marshal(certificate)
	if err != nil {
		return fmt.Errorf("failed to marshal certificate: %v", err)
	}

	// Store certificate on blockchain
	err = ctx.GetStub().PutState(certificateID, certificateJSON)
	if err != nil {
		return fmt.Errorf("failed to store certificate: %v", err)
	}

	// Create composite key for querying by student
	studentIndexKey, err := ctx.GetStub().CreateCompositeKey("student~certificate", []string{studentDID, certificateID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}
	err = ctx.GetStub().PutState(studentIndexKey, []byte{0x00})
	if err != nil {
		return fmt.Errorf("failed to store student index: %v", err)
	}

	// Emit event
	eventPayload := map[string]string{
		"certificateID": certificateID,
		"studentDID":    studentDID,
		"issuerDID":     issuerDID,
		"action":        "ISSUED",
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("CertificateIssued", eventJSON)

	return nil
}

// ReadCertificate retrieves a certificate by ID
func (cm *CertificateManager) ReadCertificate(
	ctx contractapi.TransactionContextInterface,
	certificateID string,
) (*Certificate, error) {
	certificateJSON, err := ctx.GetStub().GetState(certificateID)
	if err != nil {
		return nil, fmt.Errorf("failed to read certificate: %v", err)
	}
	if certificateJSON == nil {
		return nil, fmt.Errorf("certificate %s does not exist", certificateID)
	}

	var certificate Certificate
	err = json.Unmarshal(certificateJSON, &certificate)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal certificate: %v", err)
	}

	return &certificate, nil
}

// VerifyCertificate verifies a certificate's authenticity and validity
func (cm *CertificateManager) VerifyCertificate(
	ctx contractapi.TransactionContextInterface,
	certificateID string,
	certificateHash string,
) (bool, error) {
	certificate, err := cm.ReadCertificate(ctx, certificateID)
	if err != nil {
		return false, err
	}

	// Verify hash matches
	if certificate.CertificateHash != certificateHash {
		return false, fmt.Errorf("certificate hash mismatch")
	}

	// Check revocation status
	if certificate.RevocationStatus == "REVOKED" {
		return false, fmt.Errorf("certificate has been revoked")
	}

	return true, nil
}

// RevokeCertificate revokes a certificate
func (cm *CertificateManager) RevokeCertificate(
	ctx contractapi.TransactionContextInterface,
	certificateID string,
	reason string,
) error {
	// Verify caller is authorized
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	if clientMSPID != "Org1MSP" {
		return fmt.Errorf("unauthorized: only university can revoke certificates")
	}

	// Get certificate
	certificate, err := cm.ReadCertificate(ctx, certificateID)
	if err != nil {
		return err
	}

	// Update revocation status
	certificate.RevocationStatus = "REVOKED"
	certificate.RevocationDate = time.Now().Format(time.RFC3339)
	certificate.RevocationReason = reason

	// Store updated certificate
	certificateJSON, err := json.Marshal(certificate)
	if err != nil {
		return fmt.Errorf("failed to marshal certificate: %v", err)
	}

	err = ctx.GetStub().PutState(certificateID, certificateJSON)
	if err != nil {
		return fmt.Errorf("failed to update certificate: %v", err)
	}

	// Emit event
	eventPayload := map[string]string{
		"certificateID":    certificateID,
		"action":           "REVOKED",
		"revocationReason": reason,
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("CertificateRevoked", eventJSON)

	return nil
}

// QueryCertificatesByStudent retrieves all certificates for a student using composite key
// This method works with both LevelDB and CouchDB
func (cm *CertificateManager) QueryCertificatesByStudent(
	ctx contractapi.TransactionContextInterface,
	studentDID string,
) ([]*Certificate, error) {
	// Use composite key to query certificates by student
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("student~certificate", []string{studentDID})
	if err != nil {
		return nil, fmt.Errorf("failed to get certificates by student: %v", err)
	}
	defer resultsIterator.Close()

	var certificates []*Certificate
	for resultsIterator.HasNext() {
		responseRange, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// Extract certificate ID from composite key
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(responseRange.Key)
		if err != nil {
			return nil, err
		}
		
		if len(compositeKeyParts) < 2 {
			continue
		}
		
		certificateID := compositeKeyParts[1]
		
		// Read the actual certificate
		certificate, err := cm.ReadCertificate(ctx, certificateID)
		if err != nil {
			continue // Skip if certificate not found
		}
		
		certificates = append(certificates, certificate)
	}

	return certificates, nil
}

// GetCertificateHistory retrieves the transaction history for a certificate
func (cm *CertificateManager) GetCertificateHistory(
	ctx contractapi.TransactionContextInterface,
	certificateID string,
) ([]map[string]interface{}, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey(certificateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get certificate history: %v", err)
	}
	defer historyIterator.Close()

	var history []map[string]interface{}
	for historyIterator.HasNext() {
		modification, err := historyIterator.Next()
		if err != nil {
			return nil, err
		}

		var certificate Certificate
		if len(modification.Value) > 0 {
			json.Unmarshal(modification.Value, &certificate)
		}

		record := map[string]interface{}{
			"txId":      modification.TxId,
			"timestamp": modification.Timestamp,
			"isDelete":  modification.IsDelete,
			"value":     certificate,
		}
		history = append(history, record)
	}

	return history, nil
}
