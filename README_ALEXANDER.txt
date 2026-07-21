1. Pones las crednecial en ./.env basado en .env.example


docker-compose down -v
-----------------------------------
step to step
docker-compose up -d postgres redis


docker logs ecommerce-appweb-postgres-1
# Debe indicar: "database system is ready to accept connections"

docker-compose up -d auth-service inventory-service chat-service bff-web bff-admin prometheus grafana


------------------------------------------------
Faster
# 1. Levanta primero infraestructura persistente
docker-compose up -d postgres redis

# 2. Levanta todo el resto de componentes de la aplicación
docker-compose up -d