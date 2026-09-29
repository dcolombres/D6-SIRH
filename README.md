# D6-SIRH (Laravel)

Follow-up del **Sistema Integral de Recursos Humanos** — Laravel 11 + Blade + Alpine + Docker.

## Para DevOps (ambiente de TEST)

Guía completa: **[docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md)**

```bash
git checkout Laravel
cp .env.test.example .env
# Completar APP_KEY y passwords en .env
docker compose up -d --build
./scripts/smoke-test.sh http://localhost:3848
```

Plantilla de variables: [`.env.test.example`](.env.test.example)

## Stack

- PHP 8.3-FPM / Laravel 11  
- MySQL 8  
- nginx  
- Vite + Tailwind + Alpine.js + Chart.js  

## Navegación

**Sidebar:** Hoy → Módulos SIRH → Tablero  
**Header:** Informe · Administración (íconos)

## Desarrollo local

```bash
cp .env.example .env
# APP_KEY: php artisan key:generate   (o docker run php:8.3-cli …)
docker compose -f docker-compose.dev.yml up -d
npm install && npm run build
```

App: http://localhost:3848

## API

| Método | Ruta |
|--------|------|
| GET | `/api/health` |
| GET/POST | `/api/sirh/modulos` |
| DELETE | `/api/sirh/modulos/{id}` |
| GET | `/api/sirh/catalogos` · `/api/sirh/stats` |
| GET/POST | `/api/sirh/export` · `/api/sirh/import` · `/api/sirh/backup` |
| POST | `/api/sirh/undo-import` |

## Legacy Node

Quedó en [`legacy/`](legacy/) (referencia). No forma parte del despliegue Laravel.

## Docs

- [docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md) — handoff DevOps  
- [docs/documento-funcional.md](docs/documento-funcional.md) — funcional  
