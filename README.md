# D6-SIRH (Laravel)

Follow-up del **Sistema Integral de Recursos Humanos** — Laravel 11 + Blade + Alpine + Docker.

## Repositorio

- GitHub: https://github.com/dcolombres/D6-SIRH  
- GitLab (producción): https://git.produccion.gob.ar/secretaria-legal-y-administrativa/d6-sirh  

Rama principal: **`main`**.

## Arranque rápido — desarrollo local

No requiere build de imagen (usa `php:8.3-fpm` + bind mount):

```bash
git checkout main
cp .env.example .env
# Generar APP_KEY (obligatorio):
docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
# Pegar el valor en APP_KEY= del .env

docker compose -f docker-compose.dev.yml up -d
npm install && npm run build
```

UI: http://localhost:3848  
Health: http://localhost:3848/api/health

## Arranque — ambiente de TEST (DevOps)

Guía completa: **[docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md)**

```bash
git checkout main
cp .env.test.example .env
# Completar APP_KEY, DB_PASSWORD y MYSQL_ROOT_PASSWORD
docker compose up -d --build
./scripts/smoke-test.sh http://localhost:3848
```

Plantilla: [`.env.test.example`](.env.test.example)

> Si el host tiene proxy SSL corporativo (error `curl error 60` en `composer install` del Dockerfile), usar el stack de desarrollo (`docker-compose.dev.yml`) o configurar el CA de la organización en el build.

## Stack

- PHP 8.3-FPM / Laravel 11  
- MySQL 8  
- nginx  
- Vite + Tailwind + Alpine.js + Chart.js  

## Navegación

**Sidebar:** Hoy → Módulos SIRH → Tablero  
**Header:** Informe · Administración (íconos)

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

- [INSTRUCCIONES.md](INSTRUCCIONES.md) — uso diario  
- [docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md) — handoff DevOps  
- [docs/documento-funcional.md](docs/documento-funcional.md) — funcional  
- [CHANGELOG.md](CHANGELOG.md) — historial de cambios  
