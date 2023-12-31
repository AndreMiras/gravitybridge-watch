provider "cloudflare" {
  api_token = data.google_secret_manager_secret_version.cloudflare_api_token.secret_data
}

resource "cloudflare_record" "prometheus" {
  name    = var.prometheus_domain_prefix
  zone_id = var.cloudflare_zone_id
  value   = module.gce_prometheus_worker_container.google_compute_instance_ip
  type    = "A"
  proxied = true
}

# Enable flexible SSL encryption for Prometheus
resource "cloudflare_page_rule" "prometheus" {
  zone_id  = var.cloudflare_zone_id
  target   = "${local.prometheus_domain_name}/*"
  priority = 1
  actions {
    ssl = "flexible"
  }
}
