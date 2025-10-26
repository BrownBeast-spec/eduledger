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

// ConsentManager manages consent-based access to certificates
type ConsentManager struct {
	contractapi.Contract
}

// ConsentRecord represents a consent given by a student to a verifier
type ConsentRecord struct {
	ConsentID        string    `json:"consentID"`
	HolderDID        string    `json:"holderDID"`   // Student DID
	VerifierDID      string    `json:"verifierDID"` // Employer/Verifier DID
	CertificateID    string    `json:"certificateID"`
	Purpose          string    `json:"purpose"`   // "employment", "transfer", etc.
	DataScope        []string  `json:"dataScope"` // Fields student allows verifier to see
	GrantedAt        time.Time `json:"grantedAt"`
	ExpiresAt        time.Time `json:"expiresAt"`
	Status           string    `json:"status"`      // "ACTIVE", "REVOKED", "EXPIRED"
	AccessCount      int       `json:"accessCount"` // Number of times accessed
	LastAccessedAt   time.Time `json:"lastAccessedAt,omitempty"`
	RevocationReason string    `json:"revocationReason,omitempty"`
	ObjectType       string    `json:"objectType"`
}

// GrantConsent allows a student to grant access to their certificate
func (cm *ConsentManager) GrantConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	holderDID string,
	verifierDID string,
	certificateID string,
	purpose string,
	dataScopeJSON string,
	durationDays int,
) error {
	// Verify caller identity
	callerID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get caller identity: %v", err)
	}

	// Note: In production, verify callerID matches holderDID
	// For now, we'll allow any authorized client

	// Check if certificate exists
	certManager := &CertificateManager{}
	certificate, err := certManager.ReadCertificate(ctx, certificateID)
	if err != nil {
		return fmt.Errorf("certificate not found: %v", err)
	}

	// Verify certificate belongs to holder
	if certificate.StudentDID != holderDID {
		return fmt.Errorf("certificate does not belong to holder")
	}

	// Parse data scope
	var dataScope []string
	err = json.Unmarshal([]byte(dataScopeJSON), &dataScope)
	if err != nil {
		return fmt.Errorf("failed to unmarshal data scope: %v", err)
	}

	// Create consent record
	consent := ConsentRecord{
		ConsentID:     consentID,
		HolderDID:     holderDID,
		VerifierDID:   verifierDID,
		CertificateID: certificateID,
		Purpose:       purpose,
		DataScope:     dataScope,
		GrantedAt:     time.Now(),
		ExpiresAt:     time.Now().AddDate(0, 0, durationDays),
		Status:        "ACTIVE",
		AccessCount:   0,
		ObjectType:    "consent",
	}

	// Marshal consent to JSON
	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return fmt.Errorf("failed to marshal consent: %v", err)
	}

	// Store consent on blockchain
	err = ctx.GetStub().PutState(consentID, consentJSON)
	if err != nil {
		return fmt.Errorf("failed to store consent: %v", err)
	}

	// Create composite keys for querying
	verifierIndexKey, err := ctx.GetStub().CreateCompositeKey("verifier~consent", []string{verifierDID, consentID})
	if err != nil {
		return fmt.Errorf("failed to create verifier composite key: %v", err)
	}
	ctx.GetStub().PutState(verifierIndexKey, []byte{0x00})

	holderIndexKey, err := ctx.GetStub().CreateCompositeKey("holder~consent", []string{holderDID, consentID})
	if err != nil {
		return fmt.Errorf("failed to create holder composite key: %v", err)
	}
	ctx.GetStub().PutState(holderIndexKey, []byte{0x00})

	// Emit event
	eventPayload := map[string]string{
		"consentID":     consentID,
		"holderDID":     holderDID,
		"verifierDID":   verifierDID,
		"certificateID": certificateID,
		"action":        "GRANTED",
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("ConsentGranted", eventJSON)

	fmt.Printf("Consent granted: %s by %s to %s (Caller: %s)\n", consentID, holderDID, verifierDID, callerID)

	return nil
}

// VerifyConsent checks if a verifier has valid consent to access certificate
func (cm *ConsentManager) VerifyConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	verifierDID string,
) (*ConsentRecord, error) {
	// Retrieve consent record
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return nil, fmt.Errorf("failed to read consent: %v", err)
	}
	if consentJSON == nil {
		return nil, fmt.Errorf("consent %s not found", consentID)
	}

	var consent ConsentRecord
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal consent: %v", err)
	}

	// Verify verifier DID matches
	if consent.VerifierDID != verifierDID {
		return nil, fmt.Errorf("verifier DID mismatch")
	}

	// Check if consent is active
	if consent.Status != "ACTIVE" {
		return nil, fmt.Errorf("consent status is %s", consent.Status)
	}

	// Check expiration
	if time.Now().After(consent.ExpiresAt) {
		// Auto-expire consent
		consent.Status = "EXPIRED"
		consentJSON, _ := json.Marshal(consent)
		ctx.GetStub().PutState(consentID, consentJSON)
		return nil, fmt.Errorf("consent has expired")
	}

	// Update access count and last accessed time
	consent.AccessCount++
	consent.LastAccessedAt = time.Now()

	consentJSON, _ = json.Marshal(consent)
	ctx.GetStub().PutState(consentID, consentJSON)

	return &consent, nil
}

// RevokeConsent allows a student to revoke previously granted consent
func (cm *ConsentManager) RevokeConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	reason string,
) error {
	// Retrieve consent
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return fmt.Errorf("failed to read consent: %v", err)
	}
	if consentJSON == nil {
		return fmt.Errorf("consent %s not found", consentID)
	}

	var consent ConsentRecord
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return fmt.Errorf("failed to unmarshal consent: %v", err)
	}

	// Verify caller is the holder (in production, verify identity)
	callerID, _ := ctx.GetClientIdentity().GetID()

	// Update consent status
	consent.Status = "REVOKED"
	consent.RevocationReason = reason

	// Store updated consent
	consentJSON, err = json.Marshal(consent)
	if err != nil {
		return fmt.Errorf("failed to marshal consent: %v", err)
	}

	err = ctx.GetStub().PutState(consentID, consentJSON)
	if err != nil {
		return fmt.Errorf("failed to update consent: %v", err)
	}

	// Emit event
	eventPayload := map[string]string{
		"consentID":        consentID,
		"verifierDID":      consent.VerifierDID,
		"action":           "REVOKED",
		"revocationReason": reason,
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("ConsentRevoked", eventJSON)

	fmt.Printf("Consent revoked: %s by holder %s (Caller: %s)\n", consentID, consent.HolderDID, callerID)

	return nil
}

// ReadConsent retrieves a consent record by ID
func (cm *ConsentManager) ReadConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) (*ConsentRecord, error) {
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return nil, fmt.Errorf("failed to read consent: %v", err)
	}
	if consentJSON == nil {
		return nil, fmt.Errorf("consent %s not found", consentID)
	}

	var consent ConsentRecord
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal consent: %v", err)
	}

	return &consent, nil
}

// QueryConsentsByStudent retrieves all consents granted by a student
func (cm *ConsentManager) QueryConsentsByStudent(
	ctx contractapi.TransactionContextInterface,
	holderDID string,
) ([]*ConsentRecord, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"objectType": "consent",
			"holderDID": "%s"
		}
	}`, holderDID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var consents []*ConsentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent ConsentRecord
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

// QueryConsentsByVerifier retrieves all consents granted to a verifier
func (cm *ConsentManager) QueryConsentsByVerifier(
	ctx contractapi.TransactionContextInterface,
	verifierDID string,
) ([]*ConsentRecord, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"objectType": "consent",
			"verifierDID": "%s",
			"status": "ACTIVE"
		}
	}`, verifierDID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var consents []*ConsentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent ConsentRecord
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		consents = append(consents, &consent)
	}

	return consents, nil
}

// AccessCertificateWithConsent verifies consent and returns filtered certificate data
func (cm *ConsentManager) AccessCertificateWithConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	verifierDID string,
) (map[string]interface{}, error) {
	// Verify consent
	consent, err := cm.VerifyConsent(ctx, consentID, verifierDID)
	if err != nil {
		return nil, fmt.Errorf("consent verification failed: %v", err)
	}

	// Retrieve certificate
	certManager := &CertificateManager{}
	certificate, err := certManager.ReadCertificate(ctx, consent.CertificateID)
	if err != nil {
		return nil, fmt.Errorf("failed to read certificate: %v", err)
	}

	// Filter certificate data based on consent scope
	filteredData := make(map[string]interface{})
	filteredData["certificateID"] = certificate.CertificateID
	filteredData["revocationStatus"] = certificate.RevocationStatus
	filteredData["issuerDID"] = certificate.IssuerDID

	// Include only fields specified in data scope
	for _, field := range consent.DataScope {
		if value, exists := certificate.Metadata[field]; exists {
			filteredData[field] = value
		}
	}

	return filteredData, nil
}
