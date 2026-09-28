# Helical Insight · SIRH Gerencia (D6)

Flujo óptimo:

1. **Módulos** en D6 (`/pages/sirh.html`): ABM en **SQLite** (`data/sirh.sqlite`).
2. **Publicar en Helical**: regenera `DATA` en `dashboard.html` y hace `docker cp` al contenedor.
3. **Gerencia** (`/pages/helical.html`): login Helical → **Dashboard SIRH**.

## Prerrequisitos

1. Helical Insight corriendo (Docker / nginx en **443**).
2. Confirmar: `https://localhost/hi-ee/` (confiás el certificado en el navegador).
3. Carpeta **`SIRH`** / **`Gerencia_SIRH.efw`** en File Browser.

## App web local

```bash
npm start
```

API: `http://127.0.0.1:3847/api/sirh/*`

## Seed / deploy

```bash
npm run helical:deploy-sirh
```

O desde la UI: **Publicar en Helical**.

## Embed

Admin: `dir=SIRH`, `file=Gerencia_SIRH.efw`, base `https://localhost/hi-ee/`.

URL EFW: `https://localhost/hi-ee/getEFWSolution?dir=SIRH&file=Gerencia_SIRH.efw&mode=open`
