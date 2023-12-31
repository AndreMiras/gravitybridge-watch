resource "google_compute_address" "static" {
  provider = google-beta
  name     = "${local.prefix}${var.instance_name}-address${local.suffix}"
  labels   = local.labels
}

resource "google_compute_address" "static_internal" {
  provider     = google-beta
  name         = "${local.prefix}${var.instance_name}-internal-address${local.suffix}"
  address_type = "INTERNAL"
  labels       = local.labels
}
