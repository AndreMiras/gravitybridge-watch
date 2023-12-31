data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_v2_service" "grafana" {
  name     = "${var.service_name}-grafana"
  location = var.region
  labels = {
    service_name = var.service_name
  }
  template {
    scaling {
      # limit scale up to prevent any cost blow outs
      max_instance_count = 5
    }
    containers {
      image = local.grafana_image
      ports {
        container_port = 3000
      }
      env {
        name  = "GF_AUTH_ANONYMOUS_ENABLED"
        value = "true"
      }
      env {
        name  = "GF_AUTH_ANONYMOUS_ORG_ROLE"
        value = "Viewer"
      }
      env {
        name = "GF_SECURITY_ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.grafana_admin_password.secret_id
            version = "latest"
          }
        }
      }
    }
    service_account = var.client_email
  }
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  depends_on = [
    google_project_service.cloud_run_api,
  ]
}

resource "google_cloud_run_v2_service_iam_policy" "grafana_noauth" {
  location    = google_cloud_run_v2_service.grafana.location
  project     = google_cloud_run_v2_service.grafana.project
  name        = google_cloud_run_v2_service.grafana.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

resource "google_cloud_run_domain_mapping" "grafana" {
  location = var.region
  name     = local.grafana_domain_name
  metadata {
    namespace = var.project
    labels = {
      service_name = var.service_name
    }
  }
  spec {
    route_name = google_cloud_run_v2_service.grafana.name
  }
}
