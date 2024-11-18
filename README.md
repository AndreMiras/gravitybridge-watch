# Gravity Bridge Watch

[![get-validator-info-map](https://github.com/AndreMiras/gravitybridge-watch/actions/workflows/get-validator-info-map.yml/badge.svg)](https://github.com/AndreMiras/gravitybridge-watch/actions/workflows/get-validator-info-map.yml)

The Gravity Bridge Orchestrator watcher <https://gravitybridge.watch>

## Services & Endpoints

- https://gravitybridge.watch
  - /metrics
  - /api/get-last-observed-eth-nonce/
  - /api/get-validator-info-map/
- https://prometheus.gravitybridge.watch
- https://grafana.gravitybridge.watch

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

## Deployments

### Frontend

It's managed via the Vercel built-in CI/CD, but a deployment can be triggered manually using the vercel CLI.

```sh
npx vercel
```

### Infra changes

Infra changes are handled by terraform.

```sh
make devops/terraform/apply
```

### Cloudflare worker

We're leveraging a Cloudflare worker for the Grafana reverse proxy.
This is just used to map our custom domain to the Cloud Run service.
Build it with:

```sh
npm run build:wrangler
```

And then deploy the Terraform changes a usual.

### Prometheus

On Docker image changes, re-build the image, push it and restart the VM.

```sh
make docker/login
make docker/push
make devops/gcloud/reboot/prometheus
```

### Grafana

On Docker image changes, re-build the image, push it and redeploy the Cloud Run service with.

```sh
make devops/gcloud/redeploy/grafana
```
