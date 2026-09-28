const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

/** Estados clásicos de ciclo de vida del módulo. */
const ESTADOS_CLASICOS = [
  'Planificado',
  'Alcance',
  'En desarrollo',
  'En pruebas',
  'Operativo',
  'Pausado',
  'Cancelado',
];

const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const RIESGOS = ['Alto', 'Medio', 'Bajo'];

const SEED_MODULOS = [
  { modulo: 'Núcleo / Identidad', fase: 'Plataforma', estado: 'En desarrollo', prioridad: 'Alta', avance: 72, riesgo: 'Medio', responsable: 'Equipo Plataforma', proveedor: '', fecha_inicio: '2026-01-15', fecha_fin_prevista: '2026-06-30', fecha_fin_real: '', bloqueo: 'SSO institucional pendiente de homologación', hito: 'API personas v1' },
  { modulo: 'Legajos', fase: 'Core RRHH', estado: 'En desarrollo', prioridad: 'Alta', avance: 58, riesgo: 'Alto', responsable: 'Equipo Funcional', proveedor: '', fecha_inicio: '2026-02-01', fecha_fin_prevista: '2026-08-15', fecha_fin_real: '', bloqueo: 'Definición de tipologías de vínculo', hito: 'Alta / baja / traslado' },
  { modulo: 'Estructura organizacional', fase: 'Core RRHH', estado: 'Alcance', prioridad: 'Alta', avance: 35, riesgo: 'Medio', responsable: 'Equipo Funcional', proveedor: '', fecha_inicio: '2026-03-01', fecha_fin_prevista: '2026-07-31', fecha_fin_real: '', bloqueo: 'Árbol de cargos vs. organigrama oficial', hito: 'Modelo de puestos' },
  { modulo: 'Asistencia y fichadas', fase: 'Operación', estado: 'En desarrollo', prioridad: 'Alta', avance: 44, riesgo: 'Alto', responsable: 'Equipo Integraciones', proveedor: 'Proveedor biométrico', fecha_inicio: '2026-02-15', fecha_fin_prevista: '2026-09-30', fecha_fin_real: '', bloqueo: 'Conector reloj biométrico', hito: 'Marcaciones diarias' },
  { modulo: 'Licencias', fase: 'Operación', estado: 'En pruebas', prioridad: 'Media', avance: 81, riesgo: 'Bajo', responsable: 'Equipo Funcional', proveedor: '', fecha_inicio: '2025-11-01', fecha_fin_prevista: '2026-04-30', fecha_fin_real: '', bloqueo: 'Sin bloqueo crítico', hito: 'Workflow de aprobación' },
  { modulo: 'Liquidaciones / Nómina', fase: 'Nómina', estado: 'Alcance', prioridad: 'Alta', avance: 22, riesgo: 'Alto', responsable: 'Equipo Nómina', proveedor: 'Consultora liquidaciones', fecha_inicio: '2026-04-01', fecha_fin_prevista: '2026-12-15', fecha_fin_real: '', bloqueo: 'Reglas de conceptos y conceptos variables', hito: 'Motor de liquidación piloto' },
  { modulo: 'Portal del empleado', fase: 'Autoservicio', estado: 'En desarrollo', prioridad: 'Media', avance: 49, riesgo: 'Medio', responsable: 'Equipo UX', proveedor: '', fecha_inicio: '2026-01-20', fecha_fin_prevista: '2026-07-15', fecha_fin_real: '', bloqueo: 'Diseño responsive institucional', hito: 'Consulta de recibos' },
  { modulo: 'Capacitaciones', fase: 'Desarrollo', estado: 'Planificado', prioridad: 'Baja', avance: 10, riesgo: 'Bajo', responsable: 'Equipo Funcional', proveedor: '', fecha_inicio: '2026-07-01', fecha_fin_prevista: '2026-11-30', fecha_fin_real: '', bloqueo: 'Prioridad diferida a Q3', hito: 'Catálogo de cursos' },
  { modulo: 'Evaluaciones de desempeño', fase: 'Desarrollo', estado: 'Planificado', prioridad: 'Media', avance: 8, riesgo: 'Medio', responsable: 'Equipo Funcional', proveedor: '', fecha_inicio: '2026-08-01', fecha_fin_prevista: '2027-01-31', fecha_fin_real: '', bloqueo: 'Modelo de competencias no cerrado', hito: 'Ciclo anual' },
  { modulo: 'Beneficios', fase: 'Autoservicio', estado: 'En pruebas', prioridad: 'Baja', avance: 67, riesgo: 'Bajo', responsable: 'Equipo UX', proveedor: '', fecha_inicio: '2025-12-01', fecha_fin_prevista: '2026-05-31', fecha_fin_real: '', bloqueo: 'Sin bloqueo crítico', hito: 'Alta de beneficios' },
  { modulo: 'Seguridad y roles', fase: 'Plataforma', estado: 'En desarrollo', prioridad: 'Alta', avance: 63, riesgo: 'Medio', responsable: 'Equipo Plataforma', proveedor: '', fecha_inicio: '2026-01-10', fecha_fin_prevista: '2026-06-15', fecha_fin_real: '', bloqueo: 'Matriz de permisos por área', hito: 'RBAC por módulo' },
  { modulo: 'Reportes gerenciales', fase: 'Analítica', estado: 'En desarrollo', prioridad: 'Media', avance: 40, riesgo: 'Medio', responsable: 'Equipo Datos', proveedor: '', fecha_inicio: '2026-03-15', fecha_fin_prevista: '2026-08-31', fecha_fin_real: '', bloqueo: 'Catálogo de indicadores RRHH', hito: 'Pack Gerencia v1' },
];

let SQL = null;
let db = null;
let dbPath = null;

function nowIso() {
  return new Date().toISOString();
}

function persist() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function rowFromStmt(stmt) {
  const cols = stmt.getColumnNames();
  const values = stmt.get();
  const row = {};
  cols.forEach((c, i) => { row[c] = values[i]; });
  return row;
}

function listModulos() {
  const rows = [];
  const stmt = db.prepare('SELECT * FROM sirh_modulos ORDER BY id ASC');
  while (stmt.step()) rows.push(rowFromStmt(stmt));
  stmt.free();
  return rows;
}

function tableHasColumn(table, column) {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  let found = false;
  while (stmt.step()) {
    const info = rowFromStmt(stmt);
    if (info.name === column) found = true;
  }
  stmt.free();
  return found;
}

function migrateColumns() {
  const extras = [
    ['proveedor', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_inicio', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_fin_prevista', "TEXT NOT NULL DEFAULT ''"],
    ['fecha_fin_real', "TEXT NOT NULL DEFAULT ''"],
  ];
  extras.forEach(([col, def]) => {
    if (!tableHasColumn('sirh_modulos', col)) {
      db.run(`ALTER TABLE sirh_modulos ADD COLUMN ${col} ${def}`);
    }
  });
}

function ensureSchemaAndSeed() {
  db.run(`
    CREATE TABLE IF NOT EXISTS sirh_modulos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modulo TEXT NOT NULL,
      fase TEXT NOT NULL DEFAULT '',
      estado TEXT NOT NULL DEFAULT 'Planificado',
      prioridad TEXT NOT NULL DEFAULT 'Media',
      avance INTEGER NOT NULL DEFAULT 0,
      riesgo TEXT NOT NULL DEFAULT 'Medio',
      responsable TEXT NOT NULL DEFAULT '',
      proveedor TEXT NOT NULL DEFAULT '',
      fecha_inicio TEXT NOT NULL DEFAULT '',
      fecha_fin_prevista TEXT NOT NULL DEFAULT '',
      fecha_fin_real TEXT NOT NULL DEFAULT '',
      bloqueo TEXT NOT NULL DEFAULT '',
      hito TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);

  migrateColumns();

  const countStmt = db.prepare('SELECT COUNT(*) AS c FROM sirh_modulos');
  countStmt.step();
  const count = countStmt.get()[0];
  countStmt.free();

  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO sirh_modulos
      (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
       fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ts = nowIso();
    SEED_MODULOS.forEach((m) => {
      insert.run([
        m.modulo, m.fase, m.estado, m.prioridad, m.avance, m.riesgo,
        m.responsable || '', m.proveedor || '',
        m.fecha_inicio || '', m.fecha_fin_prevista || '', m.fecha_fin_real || '',
        m.bloqueo || '', m.hito || '', ts,
      ]);
    });
    insert.free();
    persist();
  }
}

async function initSirhDb(userDataPath) {
  if (db) return { ok: true, path: dbPath };

  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  dbPath = path.join(userDataPath, 'sirh.sqlite');
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  ensureSchemaAndSeed();
  persist();
  return { ok: true, path: dbPath };
}

function normalizeEstado(estado) {
  const raw = String(estado || '').trim();
  if (ESTADOS_CLASICOS.includes(raw)) return raw;
  return 'Planificado';
}

function upsertModulo(payload = {}) {
  const ts = nowIso();
  const modulo = String(payload.modulo || '').trim();
  if (!modulo) throw new Error('El nombre del módulo es obligatorio.');

  const fields = {
    modulo,
    fase: String(payload.fase || '').trim(),
    estado: normalizeEstado(payload.estado),
    prioridad: PRIORIDADES.includes(String(payload.prioridad || '').trim())
      ? String(payload.prioridad).trim()
      : 'Media',
    avance: Math.max(0, Math.min(100, Number(payload.avance) || 0)),
    riesgo: RIESGOS.includes(String(payload.riesgo || '').trim())
      ? String(payload.riesgo).trim()
      : 'Medio',
    responsable: String(payload.responsable || '').trim(),
    proveedor: String(payload.proveedor || '').trim(),
    fecha_inicio: String(payload.fecha_inicio || '').trim(),
    fecha_fin_prevista: String(payload.fecha_fin_prevista || '').trim(),
    fecha_fin_real: String(payload.fecha_fin_real || '').trim(),
    bloqueo: String(payload.bloqueo || '').trim(),
    hito: String(payload.hito || '').trim(),
    updated_at: ts,
  };

  if (fields.estado === 'Operativo' && !fields.fecha_fin_real) {
    fields.fecha_fin_real = ts.slice(0, 10);
  }

  const id = payload.id != null && payload.id !== '' ? Number(payload.id) : null;

  if (id && Number.isFinite(id)) {
    db.run(
      `UPDATE sirh_modulos SET
        modulo=?, fase=?, estado=?, prioridad=?, avance=?, riesgo=?,
        responsable=?, proveedor=?, fecha_inicio=?, fecha_fin_prevista=?, fecha_fin_real=?,
        bloqueo=?, hito=?, updated_at=?
       WHERE id=?`,
      [
        fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
        fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista, fields.fecha_fin_real,
        fields.bloqueo, fields.hito, fields.updated_at, id,
      ],
    );
    persist();
    return listModulos().find((r) => r.id === id) || { id, ...fields };
  }

  db.run(
    `INSERT INTO sirh_modulos
     (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
      fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
      fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista, fields.fecha_fin_real,
      fields.bloqueo, fields.hito, fields.updated_at,
    ],
  );
  persist();
  const rows = listModulos();
  return rows[rows.length - 1];
}

function deleteModulo(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) throw new Error('ID inválido.');
  db.run('DELETE FROM sirh_modulos WHERE id=?', [num]);
  persist();
  return { ok: true, id: num };
}

/**
 * Reemplaza todos los módulos (import JSON). No re-siembra si la lista viene vacía.
 * @param {Array<object>} rows
 */
function replaceAllModulos(rows) {
  if (!Array.isArray(rows)) throw new Error('sirh_modulos debe ser un array.');
  db.run('DELETE FROM sirh_modulos');
  const insert = db.prepare(`
    INSERT INTO sirh_modulos
    (modulo, fase, estado, prioridad, avance, riesgo, responsable, proveedor,
     fecha_inicio, fecha_fin_prevista, fecha_fin_real, bloqueo, hito, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const ts = nowIso();
  rows.forEach((payload) => {
    const modulo = String(payload.modulo || '').trim();
    if (!modulo) return;
    const fields = {
      modulo,
      fase: String(payload.fase || '').trim(),
      estado: normalizeEstado(payload.estado),
      prioridad: PRIORIDADES.includes(String(payload.prioridad || '').trim())
        ? String(payload.prioridad).trim()
        : 'Media',
      avance: Math.max(0, Math.min(100, Number(payload.avance) || 0)),
      riesgo: RIESGOS.includes(String(payload.riesgo || '').trim())
        ? String(payload.riesgo).trim()
        : 'Medio',
      responsable: String(payload.responsable || '').trim(),
      proveedor: String(payload.proveedor || '').trim(),
      fecha_inicio: String(payload.fecha_inicio || '').trim(),
      fecha_fin_prevista: String(payload.fecha_fin_prevista || '').trim(),
      fecha_fin_real: String(payload.fecha_fin_real || '').trim(),
      bloqueo: String(payload.bloqueo || '').trim(),
      hito: String(payload.hito || '').trim(),
      updated_at: String(payload.updated_at || ts),
    };
    insert.run([
      fields.modulo, fields.fase, fields.estado, fields.prioridad, fields.avance, fields.riesgo,
      fields.responsable, fields.proveedor, fields.fecha_inicio, fields.fecha_fin_prevista,
      fields.fecha_fin_real, fields.bloqueo, fields.hito, fields.updated_at,
    ]);
  });
  insert.free();
  persist();
  return { ok: true, rows: listModulos().length };
}

function exportModulosPayload() {
  return listModulos().map((r) => ({
    modulo: r.modulo,
    fase: r.fase,
    estado: r.estado,
    prioridad: r.prioridad,
    avance: Number(r.avance) || 0,
    riesgo: r.riesgo,
    responsable: r.responsable || '',
    proveedor: r.proveedor || '',
    fecha_inicio: r.fecha_inicio || '',
    fecha_fin_prevista: r.fecha_fin_prevista || '',
    fecha_fin_real: r.fecha_fin_real || '',
    bloqueo: r.bloqueo || '',
    hito: r.hito || '',
    updated_at: r.updated_at || '',
  }));
}

function getCatalogos() {
  return {
    estados: ESTADOS_CLASICOS,
    prioridades: PRIORIDADES,
    riesgos: RIESGOS,
  };
}

function getDbPath() {
  return dbPath;
}

function getStats() {
  const rows = listModulos();
  const byEstado = {};
  const byRiesgo = {};
  let avanceSum = 0;
  let riesgoAlto = 0;
  let vencidos = 0;
  let prioridadAlta = 0;
  let enPruebas = 0;
  const today = new Date().toISOString().slice(0, 10);

  rows.forEach((r) => {
    const estado = r.estado || 'Sin estado';
    const riesgo = r.riesgo || 'Medio';
    byEstado[estado] = (byEstado[estado] || 0) + 1;
    byRiesgo[riesgo] = (byRiesgo[riesgo] || 0) + 1;
    avanceSum += Number(r.avance) || 0;
    if (String(riesgo).toLowerCase() === 'alto') riesgoAlto += 1;
    if (String(r.prioridad || '').toLowerCase() === 'alta') prioridadAlta += 1;
    if (String(estado).toLowerCase().includes('prueba')) enPruebas += 1;
    const fin = String(r.fecha_fin_prevista || '').trim();
    const cerrado = ['Operativo', 'Cancelado'].includes(estado);
    if (fin && fin < today && !cerrado) vencidos += 1;
  });

  const avance = [...rows]
    .sort((a, b) => (Number(b.avance) || 0) - (Number(a.avance) || 0))
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      modulo: r.modulo,
      avance: Number(r.avance) || 0,
      estado: r.estado,
      riesgo: r.riesgo,
    }));

  return {
    total: rows.length,
    avanceMedio: rows.length ? Math.round(avanceSum / rows.length) : 0,
    riesgoAlto,
    prioridadAlta,
    enPruebas,
    vencidos,
    byEstado,
    byRiesgo,
    avance,
  };
}

module.exports = {
  initSirhDb,
  listModulos,
  upsertModulo,
  deleteModulo,
  replaceAllModulos,
  exportModulosPayload,
  getDbPath,
  getCatalogos,
  getStats,
  ESTADOS_CLASICOS,
  SEED_MODULOS,
};
