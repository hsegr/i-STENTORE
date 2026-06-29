# iDS

The **iDS** folder documents the databases used by the i-STENTORE Data Governance Middleware (iDGM).

It is not a separate application component. Its purpose is to describe the data-store layer that supports the middleware, especially the storage of current and historical context information.

## Databases

The iDGM uses two main databases:

- **MongoDB** – used by the FIWARE NGSI-LD Context Broker to store the current state of context entities, including assets, attributes and operational data.

- **TimescaleDB** – used for historical and temporal data persistence. It supports time-series storage and enables temporal context queries, including NGSI-LD Temporal API functionality through FIWARE Mintaka.

## Role in the iDGM

MongoDB supports real-time context management, while TimescaleDB supports historical data access and temporal analysis.

Together, they provide the persistence layer required for the iBroker and connected i-STENTORE services to manage both current and historical information.

## Main Contents

This folder should include:

```text
iDS/
└── README.md
