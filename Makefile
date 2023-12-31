SHELL=/bin/bash

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
