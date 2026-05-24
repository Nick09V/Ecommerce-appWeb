# Ecommerce-appWeb

Arquitectura monolítica por capas para una app web con Node.js, Express, Socket.IO, PostgreSQL y Redis.

## Estructura

```text
project/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middlewares/
│   ├── sockets/
│   ├── views/
│   ├── public/
│   ├── utils/
│   └── app.js
│
├── docker/
├── postgres/
├── redis/
├── docker-compose.yml
├── package.json
└── README.md
```

## Capas

- **Presentación**: `views/`, `public/`, `sockets/`
- **Router layer**: `routes/`
- **Controller layer**: `controllers/`
- **Service layer**: `services/`
- **Data access layer**: `repositories/`, `config/database.js`, `config/redis.js`

## Ejecutar local

```bash
npm install
npm run dev
```

App: `http://localhost:3000`  
Health check: `http://localhost:3000/api/health`

## Ejecutar con Docker

```bash
docker compose up --build
```

Servicios:
- App: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
