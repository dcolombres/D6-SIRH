export const SCHEMA_VERSION = 2;
export const APP_VERSION = '1.4.0';
export const STORAGE_KEY = 'dds_state';
export const PREV_STORAGE_KEY = 'dds_state_prev';
export const PROFILE_KEY = 'dds_profile';
export const ONBOARDING_KEY = 'dds_onboarding_done';

export const DATA_KEYS = [
  'ranking', 'sistemas', 'unattended', 'finishedIncidents',
  'finishedRequests', 'requests', 'proveedores',
];

export const INITIAL_STATE = {
  ranking: [],
  sistemas: [
    { name: 'Sistema Crítico Alpha', priority: 'Alta', team: 'Equipo Infraestructura', desc: 'Monitoreo de servicios principales.' },
    { name: 'Plataforma de Gestión Beta', priority: 'Media', team: 'Equipo Desarrollo', desc: 'Soporte operativo interno.' },
  ],
  unattended: [
    { title: 'Incidente de Conectividad', status: 'Pendiente', priority: 'Alta', desc: 'Intermitencia reportada en el nodo central.' },
    { title: 'Error de Interfaz', status: 'En Revisión', priority: 'Baja', desc: 'Desalineación menor en el panel de control.' },
  ],
  finishedIncidents: [],
  finishedRequests: [],
  requests: [
    { feature: 'Nueva API de Reportes', priority: 'Alta', progress: 45, status: 'Desarrollo', expte: 'EX-2026-00000001' },
    { feature: 'Optimización de Consultas', priority: 'Estándar', progress: 10, status: 'Alcance', expte: 'EX-2026-00000002' },
  ],
  proveedores: [
    {
      name: 'Proveedor de Ejemplo 1', rubro: 'Conectividad', contactPerson: 'Persona de Contacto',
      email: 'contacto@proveedor1.com', phone: '+54 11 0000-0000', status: 'Activo',
      contractNumber: 'CT-2026-0001', contractExpiry: '', paymentTerms: '30 días',
      notes: '', team: '', linkedSystems: '', linkedIncidents: '', tasks: [],
    },
    {
      name: 'Proveedor de Ejemplo 2', rubro: 'Soporte de Hardware', contactPerson: 'Persona de Contacto',
      email: 'contacto@proveedor2.com', phone: '+54 11 0000-0001', status: 'Activo',
      contractNumber: '', contractExpiry: '', paymentTerms: '',
      notes: '', team: '', linkedSystems: '', linkedIncidents: '', tasks: [],
    },
  ],
  settings: {
    primaryColor: '#111111',
    logoUrl: null,
    appTitle: 'D6',
    appSubtitle: 'Gestión, seguimiento y reportería SIRH',
    customCSS: '',
    operatorName: '',
    lastImportAt: null,
    lastExportAt: null,
    lastPackageMeta: null,
    sidebarOverview: 'Hoy',
    sidebarSistemas: 'Sistemas',
    sidebarIncidents: 'Incidencias',
    sidebarRequests: 'Solicitudes',
    sidebarRanking: 'Ranking',
    sidebarAsignacion: 'Asignaciones',
    sidebarProveedores: 'Proveedores',
    sidebarReports: 'Reportes',
    titleOverview: 'Hoy',
    subtitleOverview: 'Qué requiere atención ahora',
    titleSistemas: 'Sistemas',
    subtitleSistemas: 'Prioridad de infraestructura',
    titleIncidents: 'Incidencias',
    subtitleIncidents: 'Hub de incidentes activos',
    titleRequests: 'Solicitudes',
    subtitleRequests: 'Expedientes y avance',
    titleRanking: 'Equipo',
    subtitleRanking: 'Desempeño y roles',
    titleAsignacion: 'Asignaciones',
    subtitleAsignacion: 'Carga por persona',
    titleProveedores: 'Proveedores',
    subtitleProveedores: 'Contratos, vínculos y tareas',
    titleReports: 'Reportes',
    subtitleReports: 'PDF, CSV e informe ejecutivo',
    helicalBaseUrl: 'https://localhost/hi-ee/',
    helicalDir: 'SIRH',
    helicalFile: 'Gerencia_SIRH.efw',
    helicalAuthMode: 'none',
    helicalUsername: '',
    helicalPassword: '',
    helicalAuthToken: '',
    roles: [
      { code: 'PM', name: 'Project Manager' },
      { code: 'LT', name: 'Líder Técnico' },
      { code: 'D', name: 'Desarrollador' },
      { code: 'AS', name: 'Analista' },
      { code: 'AD', name: 'Analista de Datos' },
      { code: 'AF', name: 'Analista Funcional' },
      { code: 'UX', name: 'UX/UI y Diseño' },
      { code: 'C', name: 'Coordinación' },
    ],
  },
};

export function getCounts(state) {
  const s = state || {};
  return {
    ranking: Array.isArray(s.ranking) ? s.ranking.length : 0,
    sistemas: Array.isArray(s.sistemas) ? s.sistemas.length : 0,
    unattended: Array.isArray(s.unattended) ? s.unattended.length : 0,
    finishedIncidents: Array.isArray(s.finishedIncidents) ? s.finishedIncidents.length : 0,
    finishedRequests: Array.isArray(s.finishedRequests) ? s.finishedRequests.length : 0,
    requests: Array.isArray(s.requests) ? s.requests.length : 0,
    proveedores: Array.isArray(s.proveedores) ? s.proveedores.length : 0,
  };
}

export function migrateState(state) {
  const s = state || {};
  const ensureArray = (key) => {
    if (!s[key] || !Array.isArray(s[key])) {
      s[key] = JSON.parse(JSON.stringify(INITIAL_STATE[key] || []));
    } else {
      s[key] = s[key].filter((item) => item !== null && typeof item === 'object');
    }
  };

  DATA_KEYS.forEach(ensureArray);

  s.proveedores.forEach((p) => {
    if (!Array.isArray(p.tasks)) p.tasks = [];
    if (typeof p.team !== 'string') p.team = '';
    if (typeof p.linkedSystems !== 'string') p.linkedSystems = '';
    if (typeof p.linkedIncidents !== 'string') p.linkedIncidents = '';
    if (typeof p.status !== 'string') p.status = 'Activo';
  });

  if (!s.settings) s.settings = JSON.parse(JSON.stringify(INITIAL_STATE.settings));
  Object.keys(INITIAL_STATE.settings).forEach((key) => {
    if (s.settings[key] === undefined) {
      s.settings[key] = JSON.parse(JSON.stringify(INITIAL_STATE.settings[key]));
    }
  });

  // Instalaciones previas usaban el puerto 8085 (no publicado en el stack nginx+Docker actual).
  const legacyHelical = String(s.settings.helicalBaseUrl || '');
  if (
    !legacyHelical ||
    /localhost:8085/i.test(legacyHelical) ||
    /127\.0\.0\.1:8085/i.test(legacyHelical)
  ) {
    s.settings.helicalBaseUrl = INITIAL_STATE.settings.helicalBaseUrl;
  }
  // Convención actual: tablero EFW (como TableroAlsina), no efwdd del diseñador.
  if (String(s.settings.helicalFile || '') === 'Gerencia_SIRH.efwdd') {
    s.settings.helicalFile = INITIAL_STATE.settings.helicalFile;
  }

  return s;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(INITIAL_STATE));
    return JSON.parse(raw);
  } catch (e) {
    console.error('State Load Error:', e);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function savePreviousState(state) {
  try {
    localStorage.setItem(PREV_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('No se pudo guardar backup previo:', e);
  }
}

export function loadPreviousState() {
  try {
    const raw = localStorage.getItem(PREV_STORAGE_KEY);
    if (!raw) return null;
    return migrateState(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile || {}));
}

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

function slugAuthor(name) {
  return String(name || 'DDS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24) || 'DDS';
}

export function buildPackage(state, { exportedBy } = {}) {
  const migrated = migrateState(JSON.parse(JSON.stringify(state)));
  const now = new Date();
  const author = exportedBy || migrated.settings.operatorName || getProfile().name || 'DDS';
  const meta = {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    exportedBy: author,
    counts: getCounts(migrated),
  };
  migrated.settings.lastExportAt = meta.exportedAt;
  migrated.settings.lastPackageMeta = meta;
  migrated.settings.operatorName = author;

  const stamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '');
  const filename = `dds_update_${stamp}_${slugAuthor(author)}.json`;

  return {
    package: {
      ...migrated,
      _meta: meta,
    },
    meta,
    filename,
  };
}

export function exportData(state, options = {}) {
  const { package: pkg, filename } = buildPackage(state, options);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pkg, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { filename, meta: pkg._meta };
}

export function validatePackage(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'El archivo no es un JSON de objeto válido.' };
  }
  const knownKeys = [...DATA_KEYS, 'settings'];
  const hasValidKey = knownKeys.some((k) => k in raw);
  if (!hasValidKey) {
    return { ok: false, error: 'El archivo no parece un paquete DDS válido.' };
  }
  return { ok: true };
}

export function stripMeta(raw) {
  const { _meta, ...rest } = raw || {};
  return { state: rest, meta: _meta || null };
}

export function diffCounts(before, after) {
  const labels = {
    ranking: 'Personal',
    sistemas: 'Sistemas',
    unattended: 'Incidencias',
    finishedIncidents: 'Inc. cerradas',
    finishedRequests: 'Sol. cerradas',
    requests: 'Solicitudes',
    proveedores: 'Proveedores',
  };
  const b = getCounts(before);
  const a = getCounts(after);
  return Object.keys(labels).map((key) => ({
    key,
    label: labels[key],
    before: b[key],
    after: a[key],
    delta: a[key] - b[key],
  }));
}

export function importDataFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        const check = validatePackage(imported);
        if (!check.ok) {
          reject(new Error(check.error));
          return;
        }
        const { state, meta } = stripMeta(imported);
        resolve({ state: migrateState(state), meta });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function resetState() {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

export function clearAllData() {
  return resetState();
}
