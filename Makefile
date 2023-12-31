SHELL=/bin/bash
PROJECT=gravitybridge-watch
REGISTRY=gcr.io/$(PROJECT)
IMAGE_TAG=latest
PROMETHEUS_IMAGE_NAME=prometheus
PROMETHEUS_DOCKER_IMAGE=$(REGISTRY)/$(PROMETHEUS_IMAGE_NAME)
CLOUDSDK_CORE_ACCOUNT?=notset


ensure-account-set:
ifeq ($(CLOUDSDK_CORE_ACCOUNT),notset)
	$(error CLOUDSDK_CORE_ACCOUNT is not set. Please set it to a valid email address.)
endif

docker/pull/prometheus:
	docker pull $(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG)

docker/pull: docker/pull/prometheus

docker/build/prometheus:
	cd docker/prometheus && docker build --tag=$(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG) .

docker/build: docker/build/prometheus

docker/login: ensure-account-set
	gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://gcr.io

docker/push/prometheus:
	docker push $(PROMETHEUS_DOCKER_IMAGE):$(IMAGE_TAG)

docker/push: ensure-account-set docker/push/prometheus

devops/terraform/fmt:
	terraform -chdir=terraform fmt -recursive -diff

devops/terraform/init:
	terraform -chdir=terraform/core init

devops/terraform/plan:
	terraform -chdir=terraform/core plan

devops/terraform/apply:
	terraform -chdir=terraform/core apply -auto-approve

devops/gcloud/reboot/vm/%:
	gcloud compute instances reset $*

devops/terraform/output:
	terraform -chdir=terraform/core output

lint/terraform:
	terraform -chdir=terraform fmt -recursive -check -diff

lint/node:
	npm run lint

lint: lint/node lint/terraform

format/node:
	npm run format

format/terraform: devops/terraform/fmt

format: format/node format/terraform
