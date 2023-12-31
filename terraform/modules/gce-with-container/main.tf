locals {
  env_variables = [for var_name, var_value in var.env_variables : {
    name  = var_name
    value = var_value
  }]
}

####################
##### CONTAINER SETUP

module "gce-container" {
  # https://github.com/terraform-google-modules/terraform-google-container-vm
  source  = "terraform-google-modules/container-vm/google"
  version = "3.1.0"

  container = {
    image        = var.image
    command      = var.custom_command
    args         = var.custom_args
    env          = local.env_variables
    volumeMounts = var.volume_mounts
    securityContext = {
      privileged : var.privileged_mode
    }
    tty : var.activate_tty
  }

  volumes = var.volumes

  restart_policy = "Always"
}

####################
##### COMPUTE ENGINE

resource "google_compute_instance" "this" {
  name         = "${local.prefix}${var.instance_name}${local.suffix}"
  machine_type = var.machine_type
  # If true, allows Terraform to stop the instance to update its properties.
  allow_stopping_for_update = true
  tags                      = var.vm_tags

  boot_disk {
    source = google_compute_disk.boot.self_link
  }

  network_interface {
    network    = var.network_name
    network_ip = var.create_static_ip ? google_compute_address.static_internal.address : null
    access_config {
      nat_ip = var.create_static_ip ? google_compute_address.static.address : null
    }
  }

  metadata = {
    gce-container-declaration = module.gce-container.metadata_value
    google-logging-enabled    = var.enable_gcp_logging
    google-monitoring-enabled = var.enable_gcp_monitoring
  }

  labels = local.labels

  service_account {
    email = var.client_email
    scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
  }

  lifecycle {
    ignore_changes = [
      # or terraform keeps planning a change (removal then recreate) for an unknown reason
      attached_disk,
      # we don't want the Container-Optimized OS changes to force a redeployment of our VM without our consent
      boot_disk[0].initialize_params[0].image,
      # VM that are already up running shouldn't be impacted by startup script updates
      metadata_startup_script,
    ]
  }

  metadata_startup_script = var.metadata_startup_script
}
