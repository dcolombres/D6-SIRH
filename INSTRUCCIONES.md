# Instrucciones — D6-SIRH (Laravel)

## Desarrollo local

1. `git checkout main`
2. `cp .env.example .env` y completar `APP_KEY` (obligatorio):

   ```bash
   docker run --rm php:8.3-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
   ```

3. `docker compose -f docker-compose.dev.yml up -d`
4. `npm install && npm run build` (primera vez o si cambian assets)
5. Abrir http://localhost:3848

Verificar: `curl -f http://localhost:3848/api/health`

Bajar: `docker compose -f docker-compose.dev.yml down`

## Test / DevOps

1. `cp .env.test.example .env` y completar `APP_KEY` + `DB_PASSWORD` + `MYSQL_ROOT_PASSWORD`
2. `docker compose up -d --build`
3. Abrir http://localhost:3848 (o la `APP_URL` configurada)
4. Smoke: `sh scripts/smoke-test.sh http://localhost:3848`

Detalle y troubleshooting MySQL: [docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md)

## Uso funcional

1. Empezá por **Hoy**
2. Editá en **Módulos SIRH** (ABM, Equipo, Proveedores)
3. Revisá **Tablero**
4. **Informe** y **Admin** están arriba a la derecha
5. Resguardo JSON en **Admin → Centro de Datos**
