resource "google_storage_bucket" "cache" {
  name          = "${var.service_name}-cache"
  force_destroy = false
  location      = "US"
  storage_class = "STANDARD"
}

