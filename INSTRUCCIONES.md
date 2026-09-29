# Instrucciones — D6-SIRH (Laravel)

## Test / DevOps

1. `cp .env.test.example .env` y completar `APP_KEY` + passwords  
2. `docker compose up -d --build`  
3. Abrir http://localhost:3848 (o la `APP_URL` configurada)  
4. Smoke: `sh scripts/smoke-test.sh`  

Detalle: [docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md)

## Uso funcional

1. Empezá por **Hoy**  
2. Editá en **Módulos SIRH**  
3. Revisá **Tablero**  
4. **Informe** y **Admin** están arriba a la derecha  
5. Resguardo JSON en **Admin → Centro de Datos**
