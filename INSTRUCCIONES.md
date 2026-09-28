# Instrucciones — D6-SIRH

## Primer uso

1. `npm install` y `npm start`.
2. En el navegador: Hoy → revisá KPIs SIRH.
3. **Módulos**: alta/edición de desarrollos.
4. Si tenés Helical en Docker: **Publicar en Helical** y abrí **Gerencia**.

## Atajos de UI

- Sidebar: bloque SIRH arriba; Operación / Informe / Admin abajo.
- Ayuda contextual: botón **?** en la barra superior.
- Reportes: CSV de módulos SIRH + CSV operativos.

## Datos

| Origen | Dónde |
|--------|-------|
| Módulos SIRH | `data/sirh.sqlite` |
| Operación / proveedores | `localStorage` del navegador |
| Tablero Helical | Repo del contenedor (tras Publicar) |

## Problemas frecuentes

- **No cargan módulos:** confirmá que `npm start` esté corriendo (API en `:3847`).
- **Helical offline / Access Denied:** login en el iframe; URL base `https://localhost/hi-ee/`.
- **Publicar falla:** `docker ps` debe listar `helical-hiee-1`.

Ver también [docs/helical-sirh.md](docs/helical-sirh.md).
