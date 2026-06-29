# iConnector

The **iConnector** is the i-STENTORE dataspace connector component. It enables secure, policy-based and interoperable data exchange between authorised participants in the i-STENTORE ecosystem, following dataspace principles and leveraging the Eclipse Dataspace Components (EDC) framework.

This folder contains the deployment artefacts, user interfaces and governance services required to configure and operate the i-STENTORE dataspace connector.

## Folder Structure

```text
iConnector/
├── Onboarding & Governance Platform UI/   # User interface for onboarding to the Data Space
├── Connector Deployment/                  # EDC-based connector deployment artefacts
├── Connector UI/                          # User interface for connector management
└── README.md
```

## Components

### Onboarding & Governance Platform

The **Onboarding & Governance Platform** provides the services required for participant onboarding and dataspace governance.

Its purpose is to support the registration and management of organisations participating in the i-STENTORE dataspace, enabling controlled access to connector services and supporting governance processes across the ecosystem.

### Connector Deployment

The **Connector Deployment** folder contains the deployment artefacts required to instantiate the i-STENTORE dataspace connector.

It is based on **Eclipse Dataspace Components (EDC)** and provides the configuration necessary to deploy provider and consumer connectors supporting:

- asset publication
- catalogue discovery
- contract negotiation
- policy enforcement
- authorised data transfer

In addition, the deployment includes a **blockchain-backed** configuration that enables trusted registration and verification of dataspace participants and transactions.

### Connector UI

The **Connector UI** provides a web-based interface for interacting with the connector services.

It supports connector administration and simplifies the management of assets, catalogues, contracts and transfer processes without requiring direct interaction with the connector APIs.

## Purpose

Together, these components provide the infrastructure required to deploy, configure and operate the i-STENTORE dataspace connector, enabling secure and trusted data exchange between authorised participants.
