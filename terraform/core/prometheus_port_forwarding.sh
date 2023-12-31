# Port forwarding to also expose Prometheus 9090 to 80.
# This way we can still run Prometheus as non privileged image, while exposing it over 80.
# This can later be consumed over SSL thanks to Cloudflare proxy records.
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 9090
