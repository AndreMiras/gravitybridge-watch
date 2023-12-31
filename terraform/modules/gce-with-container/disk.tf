resource "google_compute_disk" "boot" {
  name   = "${local.prefix}${var.instance_name}-boot-disk${local.suffix}"
  image  = module.gce-container.source_image
  size   = 10
  type   = "pd-balanced"
  labels = local.labels
  lifecycle {
    ignore_changes = [
      # we don't want the Container-Optimized OS changes to force a redeployment of our VM without our consent
      image,
    ]
  }
}

resource "google_compute_disk" "datadir" {
  name   = "${local.prefix}${var.instance_name}-datadir-disk${local.suffix}"
  count  = var.datadir_disk_size > 0 ? 1 : 0
  type   = "pd-balanced"
  size   = var.datadir_disk_size
  labels = local.labels
}

resource "google_compute_attached_disk" "default" {
  disk     = google_compute_disk.datadir[0].self_link
  instance = google_compute_instance.this.self_link
  count    = var.datadir_disk_size == 0 ? 0 : 1
}
