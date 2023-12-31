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
