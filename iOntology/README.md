# iOntology

The **iOntology** provides the semantic backbone of the i-STENTORE Data Governance Middleware (iDGM). It defines the common information model used across the i-STENTORE ecosystem to ensure semantic interoperability between heterogeneous energy assets, demonstrator platforms and higher-level digital services.

The ontology extends established semantic models, including **SAREF**, **SAREF4ENER**, **OM** and **QUDT**, with i-STENTORE-specific concepts required to represent energy storage technologies, flexibility services and operational data in a harmonised manner.

## Folder Contents

```text
iOntology/
├── README.md
├── ontology/
│   └── iSTENTORE-Ontology.ttl
├── context/
│   └── istentore-context-v2.0.jsonld
```

## Semantic Scope

The iOntology provides a common representation of:

* energy assets and storage technologies
* renewable energy resources and supporting equipment
* static asset properties and metadata
* dynamic operational properties
* measurements, datapoints and time series
* units of measure and value types
* flexibility and scheduling services

The ontology is designed to support semantic interoperability between demonstrators while enabling standardised data exchange through NGSI-LD.

## Ontology

The ontology is provided as an OWL ontology in Turtle (`.ttl`) format and defines:

* device and asset classes
* property and measurement classes
* flexibility service models
* relationships between assets and their expected properties
* restrictions and semantic constraints required by the i-STENTORE information model

## JSON-LD Context

The accompanying JSON-LD context provides the semantic mappings required for NGSI-LD payloads exchanged through the i-STENTORE Data Governance Middleware.

It enables applications using the FIWARE NGSI-LD Context Broker to interpret JSON attributes according to the ontology, ensuring consistent data representation across demonstrators and middleware services.

## Usage

The iOntology is used by:

* the **iBroker** for semantic context management
* the ontology validation mechanisms of the middleware
* the **iConnector** to exchange semantically harmonised data
* applications and services consuming NGSI-LD entities
* demonstrator platforms integrating with the i-STENTORE ecosystem

Together, the ontology and JSON-LD context establish the common semantic foundation for interoperable data exchange within the i-STENTORE platform.
