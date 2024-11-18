## Service account variables

variable "credentials" {
  type    = string
  default = "../terraform-service-key.json"
}

variable "client_email" {
  type    = string
  default = "service-account@gravitybridge-watch.iam.gserviceaccount.com"
}

## Account variables

variable "project" {
  type    = string
  default = "gravitybridge-watch"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "zone" {
  type    = string
  default = "us-central1-a"
}

variable "service_name" {
  description = "Prefix to prepend to resource names."
  type        = string
  default     = "gbw"
}

variable "prometheus_machine_type" {
  type    = string
  default = "f1-micro"
}

variable "network_name" {
  type    = string
  default = "default"
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "prometheus_image" {
  type    = string
  default = "prometheus"
}

variable "grafana_image" {
  type    = string
  default = "grafana"
}

variable "prometheus_vm_tags" {
  description = "Additional network tags for the VM."
  type        = list(string)
  default     = ["prometheus", "http-server"]
}

variable "grafana_vm_tags" {
  description = "Additional network tags for the VM."
  type        = list(string)
  default     = ["https-server"]
}

variable "prometheus_port" {
  description = "The port Prometheus is listening on."
  type        = number
  default     = 9090
}

variable "prometheus_datadir_disk_size" {
  description = "Disk (GB) used for persisting prometheus data across VM redeployments."
  type        = number
  default     = 10
}

variable "prometheus_retention_time" {
  description = "https://prometheus.io/docs/prometheus/latest/storage/#operational-aspects"
  type        = string
  default     = "90d"
}

# consumed by the Prometheus container for storing the database
variable "prometheus_container_datadir_path" {
  type    = string
  default = "/mnt/datadir"
}

# consumed by the Prometheus VM
variable "prometheus_host_datadir_path" {
  type    = string
  default = "/mnt/disks/sdb"
}

## Domains setup

variable "domain_suffix" {
  type        = string
  description = "The domain suffix used by all subdomains"
  default     = "gravitybridge.watch"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "The zone identifier"
  default     = "f44415c780d436f35c214db61459f898"
}

variable "cloudflare_account_id" {
  description = "The Cloudflare account ID"
  type        = string
  default     = "22b053e95a0d5fcaf55dbb945539d853"
}

variable "prometheus_domain_prefix" {
  type    = string
  default = "prometheus"
}

variable "grafana_domain_prefix" {
  type    = string
  default = "grafana"
}

## Cloudflare Worker

variable "worker_script_path" {
  description = "The path of the Cloudflare Worker script."
  type        = string
  default     = "../../build/cloudflare_reverse_proxy_worker.js"
}

locals {
  docker_registry        = "gcr.io/${var.project}"
  prometheus_image       = "${local.docker_registry}/${var.prometheus_image}:${var.image_tag}"
  grafana_image          = "${local.docker_registry}/${var.grafana_image}:${var.image_tag}"
  prometheus_domain_name = "${var.prometheus_domain_prefix}.${var.domain_suffix}"
  grafana_domain_name    = "${var.grafana_domain_prefix}.${var.domain_suffix}"
  volume_mounts = [
    {
      mountPath = var.prometheus_container_datadir_path
      name      = "datadir"
      readOnly  = false
    },
  ]
  volumes = [
    {
      name = "datadir"
      hostPath = {
        path = var.prometheus_host_datadir_path
      }
    },
  ]
}
