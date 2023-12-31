variable "prefix" {
  description = "Prefix to prepend to resource names."
  type        = string
  default     = ""
}

variable "suffix" {
  description = "Suffix to append to resource names."
  type        = string
  default     = ""
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}

variable "network_name" {
  type = string
}

variable "vm_tags" {
  description = "Additional network tags for the instances."
  type        = list(string)
  default     = []
}

variable "enable_gcp_logging" {
  description = "Enable the Google logging agent."
  type        = bool
  default     = true
}

variable "enable_gcp_monitoring" {
  description = "Enable the Google monitoring agent."
  type        = bool
  default     = true
}

variable "datadir_disk_size" {
  description = "Persistent disk size (GB) used for the datadir, set to 0 to disable disk completely."
  type        = number
  default     = 0
}

variable "create_static_ip" {
  description = "Create a static IP"
  type        = bool
  default     = false
}

variable "instance_name" {
  description = "The desired name to assign to the deployed instance"
}

variable "image" {
  description = "The Docker image to deploy to GCE instances"
}

variable "env_variables" {
  type    = map(string)
  default = {}
}

variable "privileged_mode" {
  type    = bool
  default = false
}

variable "labels" {
  type        = map(string)
  description = "Additional labels to attach to the instance"
  default     = null
}

# gcloud compute machine-types list | grep micro | grep us-central1-a
# e2-micro / 2 / 1.00
# f1-micro / 1 / 0.60
# gcloud compute machine-types list | grep small | grep us-central1-a
# e2-small / 2 / 2.00
# g1-small / 1 / 1.70
variable "machine_type" {
  type    = string
  default = "f1-micro"
}

variable "activate_tty" {
  type    = bool
  default = false
}

variable "custom_command" {
  type    = list(string)
  default = null
}

variable "custom_args" {
  type    = list(string)
  default = null
}

variable "additional_metadata" {
  type        = map(string)
  description = "Additional metadata to attach to the instance"
  default     = null
}

variable "client_email" {
  description = "Service account email address"
  type        = string
  default     = null
}

variable "metadata_startup_script" {
  type    = string
  default = ""
}

variable "volume_mounts" {
  type = list(object({
    mountPath = string
    name      = string
    readOnly  = bool
  }))
  default = []
}

variable "volumes" {
  type = list(object({
    name = string,
    hostPath = object({
      path = string,
    })
  }))
  default = []
}

locals {
  prefix = var.prefix == "" ? "" : "${var.prefix}-"
  suffix = var.suffix == "" ? "" : "-${var.suffix}"
  labels = merge(
    {
      container-vm  = module.gce-container.vm_container_label,
      instance_name = var.instance_name,
    },
    length(var.prefix) > 0 ? { "prefix" = var.prefix } : {},
    length(var.suffix) > 0 ? { "suffix" = var.suffix } : {},
    var.labels,
  )
}
