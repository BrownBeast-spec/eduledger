/*
Copyright 2024 University Certificate Management System

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"github.com/hyperledger/fabric-samples/edu-ledger/chaincode-go/chaincode"
)

func main() {
	eduLedgerChaincode, err := contractapi.NewChaincode(
		&chaincode.CertificateManager{},
		&chaincode.ConsentManager{},
	)

	if err != nil {
		log.Panicf("Error creating edu-ledger chaincode: %v", err)
	}

	if err := eduLedgerChaincode.Start(); err != nil {
		log.Panicf("Error starting edu-ledger chaincode: %v", err)
	}
}
