# Despliegue TEST — D6-SIRH (Laravel + Docker)

Documento para **DevOps / plataforma**. Objetivo: levantar el ambiente de test con el mínimo de pasos.

## Artefacto

- Rama Git: **`main`**
- Remotos: GitHub `dcolombres/D6-SIRH` · GitLab `secretaria-legal-y-administrativa/d6-sirh`
- Orquestación: `docker compose` (archivo raíz `docker-compose.yml`)
- Imagen app: build multi-stage (`Dockerfile`) → PHP 8.3-FPM + assets Vite
- Sidecars: `nginx:1.27-alpine`, `mysql:8.4`

## Requisitos del host

- Docker Engine 24+ y Docker Compose v2
- Puertos libres (defaults): **3848** (HTTP), **3307** (MySQL host, opcional)
- Acceso a registry/base images: `php`, `node`, `composer`, `nginx`, `mysql`
- Salida HTTPS hacia Packagist/GitHub/npm **sin** interceptación SSL sin CA (si hay proxy corporativo, instalar el CA en el build o usar el stack `docker-compose.dev.yml`)

## Variables

1. Copiar plantilla:

```bash
cp .env.test.example .env
```

2. Completar **obligatorio**:

| Variable | Descripción |
|----------|-------------|
| `APP_KEY` | `base64:…` (32 bytes). Sin esto el contenedor no arranca. |
| `APP_URL` | URL pública del test (ej. `https://d6-test.ejemplo.gob.ar`) |
| `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` | Credenciales MySQL del stack |

Generar `APP_KEY`:

```bash
docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
```

## Levantamiento

```bash
docker compose up -d --build
```

Primera vez el entrypoint:

1. Sincroniza `public/` hacia el volumen compartido con nginx  
2. Espera MySQL  
3. `php artisan migrate --force`  
4. `php artisan db:seed --force` (si `RUN_SEEDERS=true`)  
5. Cachea config/rutas/vistas  
6. Arranca `php-fpm`

## Verificación

```bash
curl -f http://localhost:3848/api/health
# {"ok":true,"app":"D6-SIRH","db":"mysql"}

curl -f http://localhost:3848/api/sirh/stats
curl -f -o /dev/null -w "%{http_code}\n" http://localhost:3848/
```

UI: abrir `APP_URL` (default http://localhost:3848).

## Operación habitual

| Acción | Comando |
|--------|---------|
| Logs app | `docker compose logs -f app` |
| Migrar | `docker compose exec app php artisan migrate --force` |
| Seed | `docker compose exec app php artisan db:seed --force` |
| Reconstruir | `docker compose up -d --build` |
| Bajar | `docker compose down` |
| Reset DB (destructivo) | `docker compose down -v && docker compose up -d --build` |

## Integración con DB / ingress externos

Si el ambiente ya tiene MySQL o un ingress:

1. En `.env`: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` apuntando al servicio externo.  
2. Quitar o comentar el servicio `mysql` del compose (o usar override).  
3. Publicar solo `nginx` detrás del reverse proxy; setear `APP_URL` al host público.  
4. `RUN_SEEDERS=false` si la DB ya tiene datos.

Override ejemplo (`docker-compose.override.yml` local a plataforma, no commitear secretos):

```yaml
services:
  mysql:
    profiles: ["disabled"]
  nginx:
    ports: []
    # labels / network del mesh de la org
```

## Healthchecks

| Check | Endpoint / puerto |
|-------|-------------------|
| MySQL | `mysqladmin ping` con `$MYSQL_ROOT_PASSWORD` del contenedor |
| App PHP-FPM | TCP 9000 (Docker healthcheck) |
| HTTP | `GET /api/health` vía nginx |
| Laravel up | `GET /up` |

### MySQL unhealthy al arrancar

Si `docker compose up` falla con `container …-mysql-1 is unhealthy`:

1. Ver logs: `docker compose logs mysql`
2. **Volumen con password viejo:** si ya existía `d6_mysql_data` y cambiaste `MYSQL_ROOT_PASSWORD` / `DB_PASSWORD` en `.env`, MySQL ignora las vars nuevas. Opciones:
   - Restaurar las passwords originales en `.env`, o
   - Reset destructivo: `docker compose down -v && docker compose up -d --build`
3. Primera inicialización lenta: el `start_period` es 40s; en hosts lentos esperar y reintentar `docker compose up -d`.
4. Puerto host ocupado: si `3307` está en uso, cambiar `MYSQL_PUBLISH_PORT` en `.env`.

## Secretos

- No commitear `.env`  
- Rotar `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD` / `APP_KEY` por ambiente  
- `APP_DEBUG=false` cuando el test sea semi-público

## Contenido opcional post-deploy

Importar dump SQLite legacy (si aplica):

```bash
# colocar archivo en ./data/sirh.sqlite en el host y montarlo, o copiar al contenedor
docker compose exec app php artisan sirh:import-sqlite /var/www/html/data/sirh.sqlite --fresh
```

## Build falla por SSL (`curl error 60`)

Síntoma: `composer install` o `npm ci` en el `Dockerfile` aborta con certificado self-signed en la cadena.

Opciones:

1. Inyectar el CA corporativo en las etapas `vendor` / `frontend` del Dockerfile.  
2. En desarrollo local, no buildear: `docker compose -f docker-compose.dev.yml up -d` (ver [INSTRUCCIONES.md](../INSTRUCCIONES.md)).  
3. Construir la imagen en un runner sin MITM SSL y publicarla al registry interno.

## Desarrollo (no usar en test)

Bind-mount local: `docker compose -f docker-compose.dev.yml up -d`

## Contacto funcional

Producto: follow-up SIRH (Hoy / Módulos / Tablero / Informe / Admin). Spec: `docs/documento-funcional.md`.
