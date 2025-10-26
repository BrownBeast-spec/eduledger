package chaincode

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ConsentManager provides functions for managing consent records
type ConsentManager struct {
	contractapi.Contract
}

// Consent represents a consent record for data sharing
type Consent struct {
	ID             string   `json:"id"`
	StudentID      string   `json:"studentId"`
	VerifierID     string   `json:"verifierId"`
	VerifierName   string   `json:"verifierName"`
	CertificateID  string   `json:"certificateId"`
	GrantedDate    string   `json:"grantedDate"`
	ExpiryDate     string   `json:"expiryDate"`
	Status         string   `json:"status"` // Active, Revoked, Expired
	Purpose        string   `json:"purpose"`
	DataShared     []string `json:"dataShared"`
	ConsentHash    string   `json:"consentHash"`
}

// InitLedger initializes the ledger with sample consent records
func (cm *ConsentManager) InitLedger(ctx contractapi.TransactionContextInterface) error {
	consents := []Consent{
		{
			ID:            "CONS001",
			StudentID:     "STU001",
			VerifierID:    "VER001",
			VerifierName:  "ABC Company",
			CertificateID: "CERT001",
			GrantedDate:   time.Now().Format(time.RFC3339),
			ExpiryDate:    time.Now().AddDate(0, 6, 0).Format(time.RFC3339),
			Status:        "Active",
			Purpose:       "Employment Verification",
			DataShared:    []string{"degree", "major", "gpa", "graduationDate"},
			ConsentHash:   "consenthash123",
		},
	}

	for _, consent := range consents {
		consentJSON, err := json.Marshal(consent)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(consent.ID, consentJSON)
		if err != nil {
			return fmt.Errorf("failed to put consent to world state: %v", err)
		}
	}

	return nil
}

// GrantConsent creates a new consent record on the ledger
func (cm *ConsentManager) GrantConsent(ctx contractapi.TransactionContextInterface, id string, studentID string, verifierID string, verifierName string, certificateID string, expiryDate string, purpose string, dataShared string, consentHash string) error {
	exists, err := cm.ConsentExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("consent %s already exists", id)
	}

	_, err := time.Parse(time.RFC3339, expiryDate)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %v", err)
	}

	var dataSharedList []string
	err = json.Unmarshal([]byte(dataShared), &dataSharedList)
	if err != nil {
		return fmt.Errorf("invalid dataShared format: %v", err)
	}

	consent := Consent{
		ID:            id,
		StudentID:     studentID,
		VerifierID:    verifierID,
		VerifierName:  verifierName,
		CertificateID: certificateID,
		GrantedDate:   time.Now().Format(time.RFC3339),
		ExpiryDate:    expiryDate,
		Status:        "Active",
		Purpose:       purpose,
		DataShared:    dataSharedList,
		ConsentHash:   consentHash,
	}

	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, consentJSON)
}

// ReadConsent returns the consent record stored in the world state with given id
func (cm *ConsentManager) ReadConsent(ctx contractapi.TransactionContextInterface, id string) (*Consent, error) {
	consentJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if consentJSON == nil {
		return nil, fmt.Errorf("consent %s does not exist", id)
	}

	var consent Consent
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return nil, err
	}

	return &consent, nil
}

// RevokeConsent revokes a consent record
func (cm *ConsentManager) RevokeConsent(ctx contractapi.TransactionContextInterface, id string) error {
	consent, err := cm.ReadConsent(ctx, id)
	if err != nil {
		return err
	}

	consent.Status = "Revoked"

	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, consentJSON)
}

// ConsentExists returns true when consent with given ID exists in world state
func (cm *ConsentManager) ConsentExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	consentJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return consentJSON != nil, nil
}

// GetAllConsents returns all consents found in world state
func (cm *ConsentManager) GetAllConsents(ctx contractapi.TransactionContextInterface) ([]*Consent, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var consents []*Consent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent Consent
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

// QueryConsentsByStudent returns all consents granted by a student
func (cm *ConsentManager) QueryConsentsByStudent(ctx contractapi.TransactionContextInterface, studentID string) ([]*Consent, error) {
	queryString := fmt.Sprintf(`{"selector":{"studentId":"%s"}}`, studentID)
	return cm.getQueryResultForQueryString(ctx, queryString)
}

// QueryConsentsByVerifier returns all consents for a specific verifier
func (cm *ConsentManager) QueryConsentsByVerifier(ctx contractapi.TransactionContextInterface, verifierID string) ([]*Consent, error) {
	queryString := fmt.Sprintf(`{"selector":{"verifierId":"%s"}}`, verifierID)
	return cm.getQueryResultForQueryString(ctx, queryString)
}

// QueryActiveConsents returns all active consents
func (cm *ConsentManager) QueryActiveConsents(ctx contractapi.TransactionContextInterface) ([]*Consent, error) {
	queryString := `{"selector":{"status":"Active"}}`
	return cm.getQueryResultForQueryString(ctx, queryString)
}

// VerifyConsent checks if a consent is valid for accessing certificate data
func (cm *ConsentManager) VerifyConsent(ctx contractapi.TransactionContextInterface, consentID string, verifierID string) (bool, error) {
	consent, err := cm.ReadConsent(ctx, consentID)
	if err != nil {
		return false, err
	}

	// Check if consent is for the correct verifier
	if consent.VerifierID != verifierID {
		return false, fmt.Errorf("consent not granted to this verifier")
	}

	// Check if consent is active
	if consent.Status != "Active" {
		return false, fmt.Errorf("consent is not active")
	}

	// Check if consent has expired
	expiryDate, err := time.Parse(time.RFC3339, consent.ExpiryDate)
	if err == nil && time.Now().After(expiryDate) {
		// Update status to expired
		consent.Status = "Expired"
		consentJSON, _ := json.Marshal(consent)
		ctx.GetStub().PutState(consentID, consentJSON)
		return false, fmt.Errorf("consent has expired")
	}

	return true, nil
}

// getQueryResultForQueryString executes the passed in query string
func (cm *ConsentManager) getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*Consent, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var consents []*Consent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent Consent
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

// GetConsentHistory returns the history of a consent record
func (cm *ConsentManager) GetConsentHistory(ctx contractapi.TransactionContextInterface, id string) ([]map[string]interface{}, error) {
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

		var consent Consent
		if len(modification.Value) > 0 {
			err = json.Unmarshal(modification.Value, &consent)
			if err != nil {
				return nil, err
			}
		}

		entry := map[string]interface{}{
			"txId":      modification.TxId,
			"timestamp": modification.Timestamp,
			"isDelete":  modification.IsDelete,
			"value":     consent,
		}
		history = append(history, entry)
	}

	return history, nil
}
