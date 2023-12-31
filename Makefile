SHELL=/bin/bash
PROJECT=gravitybridge-watch
REGION=us-central1
REGISTRY=gcr.io/$(PROJECT)
IMAGE_TAG=latest
SERVICE_NAME=gbw
PROMETHEUS_IMAGE_NAME=prometheus
GRAFANA_IMAGE_NAME=grafana
PROMETHEUS_DOCKER_IMAGE=$(REGISTRY)/$(PROMETHEUS_IMAGE_NAME)
GRAFANA_DOCKER_IMAGE=$(REGISTRY)/$(GRAFANA_IMAGE_NAME)
CLOUDSDK_CORE_ACCOUNT?=notset


ensure-account-set:
ifeq ($(CLOUDSDK_CORE_ACCOUNT),notset)
	$(error CLOUDSDK_CORE_ACCOUNT is not set. Please set it to a valid email address.)
endif

docker/pull/prometheus:
	docker pull $(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG)

docker/pull/grafana:
	docker pull $(GRAFANA_DOCKER_IMAGE):$(IMAGE_TAG)

docker/pull: docker/pull/prometheus docker/pull/grafana

docker/build/prometheus:
	cd docker/prometheus && docker build --tag=$(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG) .

docker/build/grafana:
	cd docker/grafana && docker build --tag=$(GRAFANA_DOCKER_IMAGE):$(IMAGE_TAG) .

docker/build: docker/build/prometheus docker/build/grafana

docker/login: ensure-account-set
	gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://gcr.io

docker/push/prometheus:
	docker push $(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG)

docker/push/grafana:
	docker push $(GRAFANA_DOCKER_IMAGE):$(IMAGE_TAG)

docker/push: ensure-account-set docker/push/prometheus docker/push/grafana

devops/terraform/fmt:
	terraform -chdir=terraform fmt -recursive -diff

devops/terraform/init:
	terraform -chdir=terraform/core init

devops/terraform/plan:
	terraform -chdir=terraform/core plan

devops/terraform/apply:
	terraform -chdir=terraform/core apply -auto-approve

devops/gcloud/reboot/vm/%: ensure-account-set
	gcloud --project $(PROJECT) compute instances reset $*

devops/gcloud/reboot/prometheus: ensure-account-set devops/gcloud/reboot/vm/$(SERVICE_NAME)-prometheus

devops/terraform/output:
	terraform -chdir=terraform/core output

devops/gcloud/deploy/grafana: ensure-account-set
	gcloud --project $(PROJECT) run deploy $(SERVICE_NAME)-grafana \
	--image $(GRAFANA_DOCKER_IMAGE):$(IMAGE_TAG) \
	--platform managed \
	--region $(REGION)

devops/gcloud/redeploy/grafana: devops/gcloud/deploy/grafana


lint/terraform:
	terraform -chdir=terraform fmt -recursive -check -diff

lint/node:
	npm run lint

lint: lint/node lint/terraform

format/node:
	npm run format

format/terraform: devops/terraform/fmt

format: format/node format/terraform
