resource "google_project_service" "secretmanager" {
  provider           = google
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# generated from https://dash.cloudflare.com/profile/api-tokens
data "google_secret_manager_secret_version" "cloudflare_api_token" {
  secret     = "${var.service_name}-cloudflare-api-token"
  version    = "latest"
  depends_on = [google_project_service.secretmanager]
}

# https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#admin_password
data "google_secret_manager_secret" "grafana_admin_password" {
  secret_id  = "${var.service_name}-grafana-admin-password"
  depends_on = [google_project_service.secretmanager]
}
