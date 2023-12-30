# Gravity Bridge Watch

[![get-validator-info-map](https://github.com/AndreMiras/gravitybridge-watch/actions/workflows/get-validator-info-map.yml/badge.svg)](https://github.com/AndreMiras/gravitybridge-watch/actions/workflows/get-validator-info-map.yml)

The Gravity Bridge Orchestrator watcher <https://gravitybridge.watch>

## Endpoints:

- /metrics
- /api/get-last-observed-eth-nonce/
- /api/get-validator-info-map/

## Getting Started

Copy/edit the .env.local file:

```sh
cp .env.local.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## gRPC

The Cosmos gRPC queries can be explored using grpcui, e.g.

```sh
docker run -it --rm --publish 8080:8080 fullstorydev/grpcui:latest -plaintext <server>:9090
```
