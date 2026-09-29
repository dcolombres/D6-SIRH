#!/usr/bin/env sh
set -e

cd /var/www/html

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

# Publish public/ for nginx sidecar (named volume)
if [ -d /shared/public ]; then
  echo "[d6] Syncing public assets for nginxâ€¦"
  rm -rf /shared/public/*
  cp -a public/. /shared/public/
fi

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
  echo "[d6] ERROR: APP_KEY vacÃ­o. GenerÃ¡ uno: php artisan key:generate --show"
  exit 1
fi

# Wait for MySQL
if [ -n "$DB_HOST" ] && [ "${DB_CONNECTION:-mysql}" = "mysql" ]; then
  echo "[d6] Waiting for database ${DB_HOST}:${DB_PORT:-3306}â€¦"
  i=0
  while [ "$i" -lt 60 ]; do
    if php -r "try { new PDO('mysql:host='.getenv('DB_HOST').';port='.(getenv('DB_PORT')?:3306).';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0);} catch (Throwable \$e) { exit(1);}"; then
      break
    fi
    i=$((i + 1))
    sleep 2
  done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[d6] migrateâ€¦"
  php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  echo "[d6] seedâ€¦"
  php artisan db:seed --force
fi

if [ "${CACHE_CONFIG:-true}" = "true" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache || true
fi

echo "[d6] exec: $*"
exec "$@"
