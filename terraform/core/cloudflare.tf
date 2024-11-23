provider "cloudflare" {
  api_token = data.google_secret_manager_secret_version.cloudflare_api_token.secret_data
}

# disable security and browser integrity checks for the ACME challenge as GCP needs it for custom domain mapping
resource "cloudflare_page_rule" "acme_challenge_bypass" {
  zone_id  = var.cloudflare_zone_id
  target   = "*.${var.domain_suffix}/.well-known/acme-challenge/*"
  priority = 1
  actions {
    automatic_https_rewrites = "off"
    browser_check            = "off"
    cache_level              = "bypass"
    security_level           = "essentially_off"
  }
}

resource "cloudflare_record" "prometheus" {
  name    = var.prometheus_domain_prefix
  zone_id = var.cloudflare_zone_id
  content = module.gce_prometheus_worker_container.google_compute_instance_ip
  type    = "A"
  proxied = true
}

# Enable flexible SSL encryption for Prometheus
resource "cloudflare_page_rule" "prometheus" {
  zone_id  = var.cloudflare_zone_id
  target   = "${local.prometheus_domain_name}/*"
  priority = 2
  actions {
    ssl = "flexible"
  }
}

# Enable end to end SSL encryption for Grafana as it's running in Cloud Run
resource "cloudflare_page_rule" "grafana" {
  zone_id  = var.cloudflare_zone_id
  target   = "${local.grafana_domain_name}/*"
  priority = 3
  actions {
    ssl = "strict"
  }
}

# Reverse proxy worker

resource "cloudflare_workers_script" "grafana_reverse_proxy" {
  account_id = var.cloudflare_account_id
  name       = "grafana-reverse-proxy"
  content    = file(var.worker_script_path)
  module     = true
  plain_text_binding {
    name = "PROXY_PASS_URL"
    text = google_cloud_run_v2_service.grafana.uri
  }
}

resource "cloudflare_workers_domain" "grafana_reverse_proxy" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = local.grafana_domain_name
  service    = cloudflare_workers_script.grafana_reverse_proxy.name
}

resource "cloudflare_workers_route" "grafana_reverse_proxy" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "${cloudflare_workers_domain.grafana_reverse_proxy.hostname}/*"
  script_name = cloudflare_workers_script.grafana_reverse_proxy.name
}
