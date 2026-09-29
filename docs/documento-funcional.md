# Documento funcional — D6-SIRH

**Producto:** D6-SIRH (Sistema Integral de Recursos Humanos)  
**Tipo:** App web local (Node + navegador)  
**Versión de referencia:** 1.4  
**Fecha:** 2026-09-29  
**Clasificación:** Uso interno

---

## 1. Objetivo

D6-SIRH es la herramienta de **follow-up de implementación** del SIRH: permite cargar, actualizar y consultar el estado de cada módulo del producto (avance, riesgos, fechas, personas y proveedores), con vistas diarias y gerenciales sobre la misma fuente de datos.

No reemplaza el SIRH productivo (nómina, legajos, etc.): **registra y sigue** el desarrollo/puesta en marcha de esos módulos.

## 2. Alcance

### Incluye
- Catálogo unificado de módulos SIRH (alta, edición, activar/desactivar, eliminar).
- Áreas de producto: Gestión, Tableros, Autogestión.
- Personas opcionales por módulo: responsable, proveedor, equipo de trabajo.
- Vista **Hoy** (KPIs y foco).
- Vista **Tablero** (filtrable).
- **Informe** ejecutivo (ícono en header).
- Resguardo/restauración vía JSON (backup portable).
- Persistencia de trabajo en SQLite local.

### No incluye
- Operación IT genérica (sistemas/incidencias/solicitudes ajenas al SIRH).
- ABM separado de proveedores u operación fuera del catálogo de módulos.
- Autenticación multi-usuario / SSO (uso local en estación de trabajo).
- Integración en tiempo real con el SIRH productivo.

## 3. Usuarios

| Perfil | Uso principal |
|--------|----------------|
| Dirección / Coordinación RH | Hoy, Tablero, Informe |
| Equipo de implementación | Módulos SIRH (ABM y seguimiento) |
| Operador técnico | Arranque local, Datos (backup JSON), Admin (marca) |

## 4. Mapa del producto (áreas)

Cada módulo pertenece a un área:

| Área | Audiencia | Ejemplos |
|------|-----------|----------|
| **Gestión** | Dirección de RH | Nómina, Contratos, Organigrama, Roles, Bandas horarias, Legajos… |
| **Tableros** | Usuarios gerenciales | Haberes, Banda horaria (tablero), Haberes completo… |
| **Autogestión** | Empleados | Mis recibos, Mi banda, Mis cursos, Mis licencias… |

## 5. Navegación

Orden de la barra lateral:

1. **Hoy** — follow-up diario  
2. **Módulos SIRH** — catálogo y ABM (pestañas internas: Catálogo / Equipo / Proveedores)  
3. **Tablero**  

En el header (derecha), con íconos: **Informe** y **Administración**.

## 6. Funciones por pantalla

### 6.1 Hoy
- KPIs de módulos **activos** (totales, riesgo, avance, vencidos).
- Gráficos por estado y avance.
- Lista de foco (riesgos / vencidos).
- Acceso a Centro de Datos e Informe (header).

### 6.2 Módulos SIRH
- Lista filtrable (área, estado, activo, búsqueda).
- Alta / edición / eliminación.
- Activar o desactivar (desactivar saca el módulo de Hoy/Tablero sin borrarlo).
- Campos de seguimiento: estado, prioridad, riesgo, avance %, fechas, hito, bloqueo.
- Campos opcionales de personas: responsable, proveedor, equipo (varias personas).
- Pestaña **Equipo**: personas agregadas desde responsable/equipo; clic abre el módulo.
- Pestaña **Proveedores**: proveedores del campo proveedor; clic abre el módulo.

### 6.3 Tablero
- Misma data SQLite (solo activos por defecto).
- Filtros: texto, estado, prioridad, área, riesgo.
- KPIs, tarjetas, gráficos y tabla de detalle.

### 6.4 Informe
- Resumen ejecutivo basado en módulos SIRH (riesgo, prioridad, cobertura de equipo, proveedores).
- Impresión / PDF desde el navegador.

### 6.5 Admin
- Marca (título, subtítulo, color, CSS).
- Preferencias locales.

### 6.6 Centro de Datos
- Exportar paquete JSON (módulos desde SQLite + preferencias).
- Importar JSON (reescribe módulos en SQLite).
- Deshacer último import (un nivel).

## 7. Modelo de datos del módulo

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Identidad del módulo |
| Área | Sí | gestion / tableros / autogestion |
| Descripción | No | Texto corto |
| Fase | No | Etiqueta libre (Core RRHH, Nómina…) |
| Estado | Sí | Planificado, Alcance, En desarrollo, En pruebas, Operativo, Pausado, Cancelado |
| Prioridad | Sí | Alta / Media / Baja |
| Riesgo | Sí | Alto / Medio / Bajo |
| Avance % | Sí | 0–100 |
| Fechas | No | Inicio, fin prevista, fin real |
| Responsable | No | Persona o área responsable |
| Proveedor | No | Proveedor vinculado |
| Equipo | No | Lista de personas (líneas o comas) |
| Hito / Bloqueo | No | Seguimiento cualitativo |
| Activo | Sí | Si está en Hoy/Tablero |
| Orden / Icono | No | Presentación |

**Fuente de trabajo:** `data/sirh.sqlite`  
**Backup:** JSON (`d6_backup_….json`)

## 8. Flujos principales

### Follow-up semanal
1. Abrir **Hoy** → identificar riesgos y vencidos.  
2. Abrir **Módulos SIRH** → actualizar estado, avance, fechas, personas.  
3. Abrir **Tablero** → validar lectura filtrable.  
4. Opcional: Informe / backup JSON.

### Alta de un módulo
1. Módulos → Nuevo módulo.  
2. Completar nombre, área y seguimiento.  
3. Opcional: responsable, proveedor, equipo.  
4. Guardar → aparece en Hoy/Tablero si está activo.

### Sacar un módulo de las vistas
- Preferir **Desactivar** (queda en catálogo).  
- Eliminar solo si no debe conservarse historial.

## 9. Requisitos de uso

- Node.js + `npm install` / `npm start`.
- Navegador en `http://127.0.0.1:3847`.
- Puerto configurable con `PORT`; `D6_NO_OPEN=1` evita abrir el navegador.

## 10. Criterios de aceptación (funcionales)

1. Existe un único catálogo de módulos con ABM completo.  
2. Hoy y Tablero reflejan solo módulos activos de ese catálogo.  
3. Cada módulo puede tener área Gestión / Tableros / Autogestión.  
4. Responsable, proveedor y equipo son opcionales y editables desde el módulo.  
5. Equipo y Proveedores se visualizan agregados desde el catálogo.  
6. Se puede exportar CSV SIRH y backup JSON / restaurar.  
7. No hay secciones de operación IT ajenas al SIRH en la navegación principal.

## 11. Glosario

| Término | Significado |
|---------|-------------|
| Módulo | Unidad del SIRH en seguimiento (ej. Nómina, Mis recibos) |
| Área | Clasificación de producto (Gestión / Tableros / Autogestión) |
| Activo | Visible en Hoy y Tablero |
| Follow-up | Seguimiento de avance, riesgo y plazos |
| SQLite | Base local de trabajo |
| JSON backup | Paquete portable de resguardo |

---

*Documento generado para D6-SIRH — uso interno.*
