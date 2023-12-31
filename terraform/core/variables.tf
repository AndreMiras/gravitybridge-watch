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
  default = "us-east5"
}

variable "zone" {
  type    = string
  default = "us-east5-a"
}

variable "service_name" {
  description = "Prefix to prepend to resource names."
  type        = string
  default     = "gbw"
}
