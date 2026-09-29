# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [2.0.0] - 2026-09-29

### Añadido

- Stack Laravel 11 (Blade + Alpine.js + Vite + Tailwind + Chart.js).
- Persistencia MySQL 8 con migraciones y seeders del dominio SIRH.
- Empaquetado Docker de test: `Dockerfile` multi-stage, `docker-compose.yml` (nginx + PHP-FPM + MySQL).
- `docker-compose.dev.yml` para desarrollo local.
- Plantilla `.env.test.example` y guía [docs/DEPLOY-TEST.md](docs/DEPLOY-TEST.md) para handoff a DevOps.
- Script `scripts/smoke-test.sh` de verificación post-despliegue.
- API REST bajo `/api/sirh/*` (módulos, catálogos, stats, export/import/backup, undo-import) y `/api/health`.
- Vistas Blade: Hoy, Módulos SIRH (ABM, Equipo, Proveedores), Tablero, Informe, Administración y Centro de Datos.

### Cambiado

- Runtime de Node/sql.js a PHP 8.3-FPM + MySQL.
- Documentación raíz (`README.md`, `INSTRUCCIONES.md`) orientada al despliegue Laravel.

### Eliminado

- El runtime Node deja de ser el despliegue activo (queda archivado en `legacy/` solo como referencia).

## [1.1.0] - 2026-09-29

### Añadido

- Alta de equipo y proveedores dentro de las pestañas de Módulos SIRH.
- Accesos a Informe y Administración como íconos en la barra superior derecha.

### Cambiado

- Navegación de Gerencia renombrada a Tablero en la UI.
- Etiqueta del primer ítem del sidebar fijada como «Hoy» (sin «Visión General»).
- UX del catálogo de módulos unificada.

### Eliminado

- Sección Reportes del shell.
- Residuos de Magic Report / operación legacy en la barra superior.
- Referencias residuales de marca Alsina en la top-bar.

## [1.0.1] - 2026-09-28

### Añadido

- Vista nativa de Gerencia (sin dependencia de Helical).
- Backup/restore portable en JSON vía Data Hub (módulos + estado de operación).

### Cambiado

- Los datos Workday SIRH permanecen en SQLite; el intercambio operativo usa JSON portátil.

### Eliminado

- Integración Helical.

## [1.0.0] - 2026-09-28

### Añadido

- Aplicación web D6-SIRH para seguimiento de módulos del Sistema Integral de Recursos Humanos.
- Shell de navegación, catálogo de módulos, métricas e informe.
- Persistencia local con sql.js / SQLite.

[Unreleased]: https://github.com/dcolombres/D6-SIRH/compare/9a74365...HEAD
[2.0.0]: https://github.com/dcolombres/D6-SIRH/compare/916064e...9a74365
[1.1.0]: https://github.com/dcolombres/D6-SIRH/compare/4a7bbc8...916064e
[1.0.1]: https://github.com/dcolombres/D6-SIRH/compare/381a07c...4a7bbc8
[1.0.0]: https://github.com/dcolombres/D6-SIRH/commits/381a07c
