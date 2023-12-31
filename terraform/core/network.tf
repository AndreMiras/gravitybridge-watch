resource "google_compute_firewall" "allow_tag_http" {
  name          = "${var.service_name}-ingress-tag-http"
  description   = "Ingress to allow the HTTP protocol to machines with the 'http-server' tag"
  network       = var.network_name
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
  allow {
    protocol = "tcp"
    ports    = [80]
  }
}

resource "google_compute_firewall" "allow_tag_https" {
  name          = "${var.service_name}-ingress-tag-https"
  description   = "Ingress to allow the HTTPS protocol to machines with the 'https-server' tag"
  network       = var.network_name
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["https-server"]
  allow {
    protocol = "tcp"
    ports    = [443]
  }
}

resource "google_compute_firewall" "allow_tag_prometheus" {
  name          = "${var.service_name}-ingress-tag-prometheus"
  description   = "Ingress to allow the Prometheus port to machines with the 'prometheus' tag"
  network       = var.network_name
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["prometheus"]
  allow {
    protocol = "tcp"
    ports    = [var.prometheus_port]
  }
}
