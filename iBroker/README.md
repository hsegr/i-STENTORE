# iBroker

The iBroker is the i-STENTORE Context Broker layer. It is based on the FIWARE NGSI-LD Context Broker and provides the main context-management interface of the iDGM.

It manages semantically structured NGSI-LD entities representing assets, operational data, services and related attributes. It acts as the integration point between demonstrator systems and higher-level i-STENTORE tools.

## Main Contents

This folder should include:

```text
iBroker/
├── README.md
├── config/              # Broker, Kong and Keycloak configuration
├── extensions/          # Kong extensions and custom plugins
└── postman/             # NGSI-LD API collection + Keycloak 
