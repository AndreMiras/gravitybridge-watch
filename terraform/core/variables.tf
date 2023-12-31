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

variable "prometheus_vm_tags" {
  description = "Additional network tags for the VM."
  type        = list(string)
  default     = ["prometheus", "http-server"]
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

locals {
  docker_registry  = "gcr.io/${var.project}"
  prometheus_image = "${local.docker_registry}/${var.prometheus_image}:${var.image_tag}"
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
