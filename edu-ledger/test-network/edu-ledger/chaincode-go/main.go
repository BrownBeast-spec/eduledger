package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"edu-ledger/chaincode"
)

func main() {
	certificateChaincode, err := contractapi.NewChaincode(&chaincode.CertificateManager{})
	if err != nil {
		log.Panicf("Error creating certificate chaincode: %v", err)
	}

	consentChaincode, err := contractapi.NewChaincode(&chaincode.ConsentManager{})
	if err != nil {
		log.Panicf("Error creating consent chaincode: %v", err)
	}

	if err := certificateChaincode.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}

	if err := consentChaincode.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}
}
