# i-STENTORE Data Governance Middleware

This repository contains the main middleware components developed by HSE for the **i-STENTORE Data Governance Middleware (iDGM)**.

The iDGM is the interoperability layer of the i-STENTORE digital ecosystem. It connects heterogeneous demonstrator platforms, energy assets, storage technologies and higher-level project tools, such as the Virtual Power Plant, Asset Register and Investment Planning Tool. Its purpose is to enable secure, semantic and standardised data exchange across the i-STENTORE ecosystem.

The middleware follows European interoperability and data-space principles, relying on open technologies and semantic models such as **FIWARE NGSI-LD**, **SAREF**, **SAREF4ENER**, **OM** and **QUDT**.

## iDGM Building Blocks

- **iBroker** – the NGSI-LD context-management layer, based on the **FIWARE NGSI-LD Context Broker**. It manages semantically structured context entities and includes middleware extensions for **PEP**, **ontology validation** and **RBAC**.

- **iOntology** – the semantic backbone of the middleware. It contains the semantic model artefacts used to describe assets, measurements, datapoints, time series, units and flexibility services, extending models such as **SAREF**, **SAREF4ENER**, **OM** and **QUDT**.

- **iConnector** – the data-space connector layer. It contains the configuration and deployment material for controlled, policy-based data exchange between authorised providers and consumers.

- **iDS** – the data-store documentation layer. It describes the databases used in the project, including the databases supporting current context data, historical/temporal data and related middleware services.

Together, these components provide the core middleware capabilities required for secure connectivity, semantic interoperability, context management, data persistence and trusted data sharing.

## Repository Structure

```text
iBroker/     Context Broker configuration, extensions and API examples
iOntology/   Ontology files, JSON-LD contexts, mappings and semantic artefacts
iConnector/  Data-space connector configuration and deployment guide
iDS/         Description of the databases used in the project
