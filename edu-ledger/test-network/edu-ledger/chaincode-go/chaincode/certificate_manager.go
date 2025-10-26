package chaincode

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// CertificateManager provides functions for managing educational certificates
type CertificateManager struct {
	contractapi.Contract
}

// Certificate represents an educational certificate on the blockchain
type Certificate struct {
	ID              string  `json:"id"`
	StudentID       string  `json:"studentId"`
	StudentName     string  `json:"studentName"`
	InstitutionID   string  `json:"institutionId"`
	InstitutionName string  `json:"institutionName"`
	Degree          string  `json:"degree"`
	Major           string  `json:"major"`
	GPA             float64 `json:"gpa"`
	IssueDate       string  `json:"issueDate"`
	GraduationDate  string  `json:"graduationDate"`
	CertificateHash string  `json:"certificateHash"`
	Status          string  `json:"status"` // Active, Revoked, Suspended
	Metadata        string  `json:"metadata"`
}

// InitLedger initializes the ledger with sample certificates
func (c *CertificateManager) InitLedger(ctx contractapi.TransactionContextInterface) error {
	certificates := []Certificate{
		{
			ID:              "CERT001",
			StudentID:       "STU001",
			StudentName:     "Alice Johnson",
			InstitutionID:   "INST001",
			InstitutionName: "MIT",
			Degree:          "Bachelor of Science",
			Major:           "Computer Science",
			GPA:             3.8,
			IssueDate:       time.Now().AddDate(-1, 0, 0).Format(time.RFC3339),
			GraduationDate:  time.Now().AddDate(-1, -2, 0).Format(time.RFC3339),
			CertificateHash: "hash123abc",
			Status:          "Active",
			Metadata:        "{}",
		},
	}

	for _, cert := range certificates {
		certJSON, err := json.Marshal(cert)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(cert.ID, certJSON)
		if err != nil {
			return fmt.Errorf("failed to put certificate to world state: %v", err)
		}
	}

	return nil
}

// IssueCertificate creates a new certificate on the ledger
func (c *CertificateManager) IssueCertificate(ctx contractapi.TransactionContextInterface, id string, studentID string, studentName string, institutionID string, institutionName string, degree string, major string, gpa float64, graduationDate string, certificateHash string, metadata string) error {
	exists, err := c.CertificateExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("certificate %s already exists", id)
	}

	_, err := time.Parse(time.RFC3339, graduationDate)
	if err != nil {
		return fmt.Errorf("invalid graduation date format: %v", err)
	}

	certificate := Certificate{
		ID:              id,
		StudentID:       studentID,
		StudentName:     studentName,
		InstitutionID:   institutionID,
		InstitutionName: institutionName,
		Degree:          degree,
		Major:           major,
		GPA:             gpa,
		IssueDate:       time.Now().Format(time.RFC3339),
		GraduationDate:  graduationDate,
		CertificateHash: certificateHash,
		Status:          "Active",
		Metadata:        metadata,
	}

	certJSON, err := json.Marshal(certificate)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, certJSON)
}

// ReadCertificate returns the certificate stored in the world state with given id
func (c *CertificateManager) ReadCertificate(ctx contractapi.TransactionContextInterface, id string) (*Certificate, error) {
	certJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if certJSON == nil {
		return nil, fmt.Errorf("certificate %s does not exist", id)
	}

	var certificate Certificate
	err = json.Unmarshal(certJSON, &certificate)
	if err != nil {
		return nil, err
	}

	return &certificate, nil
}

// UpdateCertificateStatus updates the status of an existing certificate
func (c *CertificateManager) UpdateCertificateStatus(ctx contractapi.TransactionContextInterface, id string, newStatus string) error {
	certificate, err := c.ReadCertificate(ctx, id)
	if err != nil {
		return err
	}

	certificate.Status = newStatus

	certJSON, err := json.Marshal(certificate)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, certJSON)
}

// RevokeCertificate revokes a certificate
func (c *CertificateManager) RevokeCertificate(ctx contractapi.TransactionContextInterface, id string) error {
	return c.UpdateCertificateStatus(ctx, id, "Revoked")
}

// CertificateExists returns true when certificate with given ID exists in world state
func (c *CertificateManager) CertificateExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	certJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return certJSON != nil, nil
}

// GetAllCertificates returns all certificates found in world state
func (c *CertificateManager) GetAllCertificates(ctx contractapi.TransactionContextInterface) ([]*Certificate, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var certificates []*Certificate
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var certificate Certificate
		err = json.Unmarshal(queryResponse.Value, &certificate)
		if err != nil {
			return nil, err
		}
		certificates = append(certificates, &certificate)
	}

	return certificates, nil
}

// QueryCertificatesByStudent returns all certificates for a given student
func (c *CertificateManager) QueryCertificatesByStudent(ctx contractapi.TransactionContextInterface, studentID string) ([]*Certificate, error) {
	queryString := fmt.Sprintf(`{"selector":{"studentId":"%s"}}`, studentID)
	return c.getQueryResultForQueryString(ctx, queryString)
}

// QueryCertificatesByInstitution returns all certificates issued by a given institution
func (c *CertificateManager) QueryCertificatesByInstitution(ctx contractapi.TransactionContextInterface, institutionID string) ([]*Certificate, error) {
	queryString := fmt.Sprintf(`{"selector":{"institutionId":"%s"}}`, institutionID)
	return c.getQueryResultForQueryString(ctx, queryString)
}

// getQueryResultForQueryString executes the passed in query string
func (c *CertificateManager) getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Certificate, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var certificates []*Certificate
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var certificate Certificate
		err = json.Unmarshal(queryResponse.Value, &certificate)
		if err != nil {
			return nil, err
		}
		certificates = append(certificates, &certificate)
	}

	return certificates, nil
}

// GetCertificateHistory returns the history of a certificate
func (c *CertificateManager) GetCertificateHistory(ctx contractapi.TransactionContextInterface, id string) ([]map[string]interface{}, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var history []map[string]interface{}
	for resultsIterator.HasNext() {
		modification, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var certificate Certificate
		if len(modification.Value) > 0 {
			err = json.Unmarshal(modification.Value, &certificate)
			if err != nil {
				return nil, err
			}
		}

		entry := map[string]interface{}{
			"txId":      modification.TxId,
			"timestamp": modification.Timestamp,
			"isDelete":  modification.IsDelete,
			"value":     certificate,
		}
		history = append(history, entry)
	}

	return history, nil
}
