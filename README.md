# D6-SIRH

**Sistema Integral de Recursos Humanos** — app web local para gestión, seguimiento y reportería de módulos SIRH, con publicación al tablero gerencial en Helical Insight.

## Qué es

D6 concentra el ciclo de vida de los desarrollos modulares del SIRH:

1. **Hoy** — KPIs y gráficos (estados, avance, riesgos, vencidos).
2. **Módulos** — ABM en SQLite (estados clásicos, fechas, responsable, proveedor).
3. **Gerencia** — tablero Helical embebido (`Gerencia_SIRH.efw`).
4. **Reportes** — CSV de módulos y exportes operativos.

Operación, Proveedores, Informe y Admin quedan disponibles como bloque secundario.

## Requisitos

- Node.js 18+
- Navegador (Chrome / Edge)
- Opcional: Docker con Helical Insight para publicar el dashboard

## Instalación y arranque

```bash
git clone https://github.com/dcolombres/D6-SIRH.git
cd D6-SIRH
npm install
npm start
```

Abre `http://127.0.0.1:3847/pages/index.html`.

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto HTTP (default `3847`) |
| `D6_NO_OPEN=1` | No abrir el navegador al iniciar |

La base SQLite se crea en `data/sirh.sqlite`.

## Flujo SIRH → Helical

```text
Módulos (ABM)  →  Publicar  →  Helical (docker cp)  →  Gerencia (iframe)
```

1. Editá módulos en **Módulos**.
2. Pulsá **Publicar en Helical** (requiere contenedor `helical-hiee-1`).
3. En **Gerencia**, iniciá sesión en Helical y abrí el dashboard SIRH.

Seed / deploy manual:

```bash
npm run helical:deploy-sirh
```

Más detalle: [docs/helical-sirh.md](docs/helical-sirh.md).

## Estructura

```text
server/          API + estáticos (Node)
pages/           UI (Hoy, Módulos, Gerencia, Admin…)
js/              Front (ES modules)
helical/         Plantilla EFW + dashboard.html
data/            SQLite local (no versionado)
vendor/          Chart.js, jsPDF, html2canvas
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Build CSS/vendor + servidor web local |
| `npm run build:css` | Compilar Tailwind |
| `npm run build:vendor` | Copiar libs a `vendor/` |
| `npm run helical:deploy-sirh` | Publicar seed SIRH a Helical |

## Notas

- Uso **local** (`127.0.0.1`): no expone la API en la red.
- Helical en HTTPS local puede pedir confiar el certificado del navegador.
- Los datos de operación/proveedores viven en `localStorage` del navegador; los módulos SIRH viven en SQLite.

## Licencia

UNLICENSED — uso interno.
