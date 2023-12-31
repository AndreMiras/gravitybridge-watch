terraform {
  backend "gcs" {
    bucket      = "gbw-infra-bucket-tfstate"
    prefix      = "terraform/state"
    credentials = "../terraform-service-key.json"
  }
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project     = var.project
  credentials = file(var.credentials)
  region      = var.region
  zone        = var.zone
}

provider "google-beta" {
  project     = var.project
  credentials = file(var.credentials)
  region      = var.region
  zone        = var.zone
}

resource "google_storage_bucket" "default" {
  name          = "${var.service_name}-infra-bucket-tfstate"
  force_destroy = false
  location      = "US"
  storage_class = "STANDARD"
  versioning {
    enabled = true
  }
}

resource "google_project_service" "cloud_resource_manager" {
  project            = var.project
  service            = "cloudresourcemanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container_registry" {
  project            = var.project
  service            = "containerregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloud_run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

data "local_file" "format_script" {
  filename = "${path.module}/format.sh"
}

data "local_file" "prometheus_port_forwarding_script" {
  filename = "${path.module}/prometheus_port_forwarding.sh"
}

module "gce_prometheus_worker_container" {
  source = "../modules/gce-with-container"
  region = var.region
  zone   = var.zone
  image  = local.prometheus_image
  custom_command = [
    "/entrypoint.sh",
  ]
  # overwrite `storage.tsdb.path` and `storage.tsdb.retention.time` from default args:
  # https://github.com/prometheus/prometheus/blob/v2.48.1/Dockerfile#L25-L28
  custom_args = [
    "/bin/prometheus",
    "--config.file",
    "/etc/prometheus/prometheus.yml",
    "--storage.tsdb.path",
    var.prometheus_container_datadir_path,
    "--web.console.libraries",
    "/usr/share/prometheus/console_libraries",
    "--web.console.templates",
    "/usr/share/prometheus/consoles",
    "--storage.tsdb.retention.time",
    var.prometheus_retention_time,
  ]
  activate_tty     = true
  machine_type     = var.prometheus_machine_type
  prefix           = var.service_name
  instance_name    = "prometheus"
  network_name     = var.network_name
  create_static_ip = true
  vm_tags          = var.prometheus_vm_tags
  # This has the permission to download images from Container Registry
  client_email      = var.client_email
  datadir_disk_size = var.prometheus_datadir_disk_size
  volume_mounts     = local.volume_mounts
  volumes           = local.volumes
  # check logs with:
  # sudo journalctl -u google-startup-scripts.service
  metadata_startup_script = join("\n", [
    data.local_file.format_script.content,
    data.local_file.prometheus_port_forwarding_script.content,
  ])
}
