# D6-SIRH

**Sistema Integral de Recursos Humanos** — app web local para gestión, seguimiento y reportería de módulos SIRH.

## Qué es

1. **Hoy** — KPIs y gráficos (estados, avance, riesgos, vencidos).
2. **Módulos** — ABM en **SQLite** (fuente de trabajo).
3. **Gerencia** — tablero filtrable nativo.
4. **Reportes** — CSV de módulos y exportes operativos.

Operación, Proveedores, Informe y Admin quedan como bloque secundario.

## Datos: SQLite + JSON

| Rol | Tecnología |
|-----|------------|
| Trabajo diario (módulos SIRH) | `data/sirh.sqlite` |
| Operación / proveedores / marca | `localStorage` del navegador |
| Resguardo / carga entre máquinas | **JSON** (`d6_backup_….json`) |

El botón **Datos** exporta un JSON con módulos SIRH (leídos de SQLite) + operación. Al importar, los módulos se reescriben en SQLite y la operación en localStorage.

## Arranque

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

## Flujo

```text
Módulos (ABM) → SQLite → Hoy / Gerencia / Reportes
Datos → JSON backup ↔ restaurar SQLite + localStorage
```

## Estructura

```text
server/     API + SQLite
pages/      Hoy, Módulos, Gerencia, Informe, Admin
js/sirh/    ABM + tablero gerencial
data/       sirh.sqlite (no versionado)
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Build CSS/vendor + servidor local |
| `npm run build:css` | Compilar Tailwind |
| `npm run build:vendor` | Copiar libs a `vendor/` |

## Licencia

UNLICENSED — uso interno.
