resource "google_storage_bucket" "cache" {
  name          = "${var.service_name}-cache"
  location      = "US"
  storage_class = "STANDARD"
}
