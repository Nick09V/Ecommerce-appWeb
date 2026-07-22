# OAuth y observabilidad

## Google OAuth
1. En Google Cloud Console crea un cliente OAuth 2.0 de tipo Aplicación web.
2. Agrega como orígenes autorizados: `http://localhost:3100` y tu dominio público HTTPS.
3. En `.env` configura `GOOGLE_CLIENT_ID=...apps.googleusercontent.com`.
4. Antes de construir el frontend crea `frontend/web/.env.production` con `VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com`. Para desarrollo usa `.env.local`.

## Observabilidad
El panel Admin > Monitoreo consulta salud de servicios, Prometheus y Loki. Grafana incluye Prometheus y Loki como datasources. Promtail lee logs de contenedores Docker. En Docker Desktop/WSL el montaje de `/var/lib/docker/containers` puede depender de la configuración; si no aparecen logs, revisa `docker compose logs promtail`.

## Seguridad
Solo usuarios con `role=admin` acceden al BFF admin. El usuario `admin@tienda.com` se migra automáticamente a rol admin.
