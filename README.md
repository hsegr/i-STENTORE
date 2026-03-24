# i-STENTORE Middleware Repository

This repository contains the main middleware components developed by HSE for the i-STENTORE Data Governance Middleware (iDGM).

The iDGM sits between underlying ESS and other connected assets, and the i-STENTORE intelligent business layer (such as the Virtual Power Plant, Investment Planning Tool, and Asset Register). Its primary goal is to provide semantic and functional interoperability across heterogeneous devices, demo platforms, and external data consumers in the wider energy and smart-grid domain. It follows European interoperability directions, including the European Data Space ecosystem, FIWARE, and energy-domain semantic models such as SAREF, SAREF4ENER, OEO, OM, and QUDT. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

## Repository Scope

The repository focuses on the core middleware building blocks currently maintained by HSE:

- **iConnector**
- **iBroker**
- **iOntology**

These components are part of the broader iDGM stack, which also includes the i-STENTORE Data Store (iDS). In the project architecture, the modules work together to support secure data exchange, semantic interoperability, and integration of demo-specific platforms with the i-STENTORE business layer. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}

## Components

### iConnector

The **iConnector** is the i-STENTORE dataspace connector. Its role is to enable controlled data exchange between participants in the i-STENTORE ecosystem through dataspace mechanisms such as:

- publishing data offerings and catalogues,
- defining policies and contract offers,
- negotiating contracts between provider and consumer,
- initiating and executing data transfers.

In the current implementation stage, the iConnector provides the essential functionality for a provider and a consumer to negotiate a contract and transfer data using a dataspace connector workflow. The implementation is based on a subset of the **Eclipse Dataspace Components (EDC)** project. The demonstrated interaction model is the **consumer-pull** scenario, where the provider exposes an offering, the consumer negotiates access, and then retrieves the data using the endpoint reference returned by the provider. :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}

In project terms, this component is what allows demo data and other digital assets to become shareable beyond a single local installation, making them available to other authorised dataspace participants and downstream applications. :contentReference[oaicite:6]{index=6}

### iBroker

The **iBroker** is the i-STENTORE Context Broker layer, built around **Orion-LD** and the **NGSI-LD** API. It is the central semantic context-management component of the middleware.

Its responsibilities include:

- managing NGSI-LD entities for assets and their attributes,
- supporting create, retrieve, update, delete, and query operations over semantic data,
- validating JSON-LD requests against the i-STENTORE ontology and contexts,
- enforcing authentication and access control through **Kong Gateway** and **Keycloak**,
- supporting real-time context management and, in the final phase, temporal/historical access through **FIWARE Mintaka** and **TimeScaleDB**.

The broker is used as the main integration hub for demo platforms, starting from Demo 3, where asset data provision and broker operations were tested as the first pilot integration path. It is intended to provide data to the i-STENTORE intelligent business layer, including VPP, IPT, lifecycle/asset management, and data-market style use cases. :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8} :contentReference[oaicite:9]{index=9}

### iOntology

The **iOntology** provides the semantic backbone of the middleware.

Its purpose is to unify the representation of:

- energy assets,
- operational measurements,
- static and dynamic parameters,
- time series and datapoints,
- scheduling and flexibility services.

The ontology reuses and extends existing standards including **SAREF**, **SAREF4ENER**, **OM**, and **QUDT**, and introduces project-specific classes and constraints needed by i-STENTORE demonstrators and services. In the final modelling approach, devices are linked to their expected properties through OWL restrictions, dynamic attributes are modelled with dedicated **Property / DataPoint / TimeSeries** patterns, and flexibility services are represented as subclasses of **s4ener:FlexOffer**. :contentReference[oaicite:10]{index=10} :contentReference[oaicite:11]{index=11} :contentReference[oaicite:12]{index=12}

This ontology is what allows JSON-LD payloads, Context Broker entities, service data models, and cross-demo harmonised APIs to be interpreted consistently across the ecosystem. :contentReference[oaicite:13]{index=13}

## How the Components Work Together

At a high level:

- **iOntology** defines the shared semantic model.
- **iBroker** stores and serves NGSI-LD entities that conform to that model.
- **iConnector** exposes selected data assets and services into a dataspace-compatible exchange workflow.

Together, these components allow proprietary demo tools and local data sources to be integrated into a common data governance layer that supports both internal project tools and external authorised consumers. D3.5 explicitly frames this as enabling interoperability across demonstrators, facilitating access from the business layer, and preparing the ground for wider data sharing and market-oriented usage. :contentReference[oaicite:14]{index=14} :contentReference[oaicite:15]{index=15}

## Current Focus

Based on D3.5 and D3.6, the middleware work has focused on:

- standardising and semantically harmonising flexibility-service data models,
- testing and extending the Context Broker integration,
- enabling secure dataspace-style exchange through the iConnector,
- refining the ontology so it fully covers assets, parameters, data, and services,
- preparing the platform for historical/temporal data and finer-grained access control. :contentReference[oaicite:16]{index=16} :contentReference[oaicite:17]{index=17} :contentReference[oaicite:18]{index=18}

## Repository Structure

- `iOntology/` — ontology files, contexts, mappings, and related semantic artefacts
- `iBroker/` — broker-related configuration, plugins, examples, and supporting assets
- `iConnector/` — dataspace connector configuration, API collections, and integration assets

## Intended Use

This repository is intended for:

- semantic integration of demo-specific digital platforms,
- NGSI-LD payload and context development,
- Context Broker integration and testing,
- dataspace-enabled data exchange,
- future extension of middleware services and interoperability features.

## Getting Started

Suggested onboarding flow:

1. Review the ontology and JSON-LD contexts under `iOntology/`.
2. Review broker payload examples and entity/API usage for `iBroker`.
3. Review dataspace negotiation and data transfer flows for `iConnector`.
4. Use the provided examples and Postman collections to test integration paths.

## Roadmap

Near-term evolution described in the project deliverables includes:

- broader demonstrator integration beyond Demo 3,
- more mature historical/temporal context support,
- finer-grained access control,
- further enhancement of dataspace policies and authentication/authorisation,
- continued service-model harmonisation and reuse across demos. :contentReference[oaicite:19]{index=19} :contentReference[oaicite:20]{index=20} :contentReference[oaicite:21]{index=21}

## Contributing

Contributions should preserve:

- alignment with the i-STENTORE ontology and JSON-LD contexts,
- compatibility with NGSI-LD broker workflows,
- interoperability with dataspace-based exchange patterns,
- consistency with the semantic and architectural decisions documented in D3.5 and D3.6.

## License

See the repository license file.