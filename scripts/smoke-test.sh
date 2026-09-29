#!/usr/bin/env sh
# Smoke checks after docker compose up
set -e
BASE="${1:-http://localhost:3848}"

echo "== health =="
curl -fsS "$BASE/api/health"
echo
echo "== stats =="
curl -fsS "$BASE/api/sirh/stats" | head -c 400
echo
echo
echo "== pages =="
for p in / /modulos /tablero /informe /admin; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
  echo "$p -> $code"
done
echo "OK"
