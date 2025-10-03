# Monitoring Setup

This directory contains monitoring configuration for the Recipe App.

## Files

- `prometheus.yml` - Prometheus configuration
- `grafana/datasources/prometheus.yml` - Grafana data source configuration
- `grafana/dashboards/` - Grafana dashboard configurations

## Access URLs

After starting with `docker-compose up`:

- **Grafana Dashboard**: http://localhost:3001
  - Username: `admin`
  - Password: `admin123`

- **Prometheus**: http://localhost:9090

- **Metrics Endpoint**: http://localhost:8080/metrics

## Key Metrics Tracked

- HTTP request rates and response times
- Database connection status
- Recipe/ingredient/purveyor counts
- User authentication attempts
- File upload statistics
- Error rates

## Dashboard

The Recipe App Dashboard shows:
- Request rates and response times
- Error rates
- Database metrics
- Authentication metrics
- System health indicators

## Troubleshooting

If metrics aren't showing up:
1. Check that backend is running: `curl http://localhost:8080/health`
2. Check metrics endpoint: `curl http://localhost:8080/metrics`
3. Check Prometheus targets: http://localhost:9090/targets
4. Check Grafana data source: http://localhost:3001/datasources
