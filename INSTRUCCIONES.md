# Instrucciones — D6-SIRH

## Primer uso

1. `npm install` y `npm start`.
2. **Hoy** → KPIs SIRH.
3. **Módulos** → alta/edición (se guarda en SQLite).
4. **Gerencia** → tablero filtrable.

## Resguardo (JSON) vs trabajo (SQLite)

- **Trabajar:** editá en Módulos → queda en `data/sirh.sqlite`.
- **Exportar:** Centro de Datos → genera `d6_backup_….json` (módulos + operación).
- **Importar:** elegí el JSON → reemplaza SQLite (módulos) y localStorage (operación).
- **Deshacer:** un nivel, desde el mismo Centro de Datos.

## Atajos

- Sidebar: SIRH arriba; Operación / Informe / Admin abajo.
- Ayuda: botón **?** .
- Reportes: CSV módulos + CSV operación.

## Problemas frecuentes

- **No cargan módulos:** `npm start` debe estar corriendo (`:3847`).
- **Import sin módulos:** el JSON debe traer `sirh_modulos` (exportá de nuevo desde esta versión).
