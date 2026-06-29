# Connector Deployment

This folder contains the Docker Compose deployment files for the connector.

## Folder Structure

- `compose.yaml`: Starts the connector, Identity Hub, Postgres, and Dozzle.
- `.env.example`: Template for local environment variables.
- `source/`: Connector source code used as the Docker build context.
- `test-keys/`: Local public/private key files mounted into the connector container.
- `credentials/`: Verifiable credential files mounted into the connector container.

The `test-keys/` and `credentials/` folders are kept in git with `.gitkeep` files, but their local contents are ignored.

## Setup

Create a local environment file from the example:

```sh
cp .env.example .env
```

Then fill in the required identity, proxy, wallet, key, and credential values in `.env`.

Place key files in `test-keys/`. By default, the deployment expects:

- `test-keys/connector-public.pem`
- `test-keys/connector-private.pem`

Place signed verifiable credentials in `credentials/`.

## Running

From this folder, start the deployment with:

```sh
docker compose up --build
```

The connector image is built from the local `source/` folder.

## Services

- `connector-postgres`: Postgres database for connector state.
- `weforming-connector`: Connector, Identity Hub and launcher container.
- `dozzle`: Container log viewer, available on `${DOZZLE_PORT:-9999}`.
