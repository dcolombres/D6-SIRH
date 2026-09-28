const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { listModulos } = require('./sirh-db.js');

const execFileAsync = promisify(execFile);

const CONTAINER = 'helical-hiee-1';
const DEST_DIR = '/usr/local/Helical Insight/hi/hi-repository/SIRH';
const DATA_START = '/* SIRH_DATA_START */';
const DATA_END = '/* SIRH_DATA_END */';

function seedDashboardPath(appRoot) {
  return path.join(appRoot, 'helical', 'repository', 'SIRH', 'dashboard.html');
}

function rowsToDataLiteral(rows) {
  const slim = rows.map((r) => ({
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
  }));
  const json = JSON.stringify(slim, null, 8)
    .replace(/^/gm, '        ')
    .replace(/^        \[/, '[')
    .replace(/\n        \]$/, '\n    ]');
  return `${DATA_START}\n    var DATA = ${json};\n    ${DATA_END}`;
}

function injectDataBlock(html, rows) {
  const block = rowsToDataLiteral(rows);
  if (html.includes(DATA_START) && html.includes(DATA_END)) {
    const re = /\/\* SIRH_DATA_START \*\/[\s\S]*?\/\* SIRH_DATA_END \*\//;
    return html.replace(re, block);
  }
  // Fallback: replace first `var DATA = [...];`
  return html.replace(/var DATA = \[[\s\S]*?\];/, block.replace(DATA_START, '').replace(DATA_END, '').trim());
}

async function dockerCp(localFile, remotePath) {
  await execFileAsync('docker', ['cp', localFile, `${CONTAINER}:${remotePath}`], {
    windowsHide: true,
    timeout: 60000,
  });
}

async function ensureRemoteDir() {
  await execFileAsync('docker', ['exec', CONTAINER, 'sh', '-c', `mkdir -p '${DEST_DIR}'`], {
    windowsHide: true,
    timeout: 30000,
  });
}

async function containerRunning() {
  try {
    const { stdout } = await execFileAsync('docker', ['ps', '--format', '{{.Names}}'], {
      windowsHide: true,
      timeout: 15000,
    });
    return String(stdout || '').split(/\r?\n/).includes(CONTAINER);
  } catch {
    return false;
  }
}

/**
 * Regenera DATA en dashboard.html y lo copia al contenedor Helical.
 * @param {string} appRoot
 */
async function publishSirhToHelical(appRoot) {
  const rows = listModulos();
  const seedPath = seedDashboardPath(appRoot);

  if (!fs.existsSync(seedPath)) {
    throw new Error(`No se encontró la plantilla del tablero: ${seedPath}`);
  }

  const original = fs.readFileSync(seedPath, 'utf8');
  const updated = injectDataBlock(original, rows);

  // En desarrollo también persistimos el seed del repo.
  try {
    fs.writeFileSync(seedPath, updated, 'utf8');
  } catch (_) {
    /* asar / read-only */
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dds-sirh-'));
  const tmpHtml = path.join(tmpDir, 'dashboard.html');
  const tmpEfw = path.join(tmpDir, 'Gerencia_SIRH.efw');
  const tmpFolder = path.join(tmpDir, 'index.efwfolder');
  fs.writeFileSync(tmpHtml, updated, 'utf8');

  const efwSrc = path.join(appRoot, 'helical', 'repository', 'SIRH', 'Gerencia_SIRH.efw');
  const folderSrc = path.join(appRoot, 'helical', 'repository', 'SIRH', 'index.efwfolder');
  if (fs.existsSync(efwSrc)) fs.copyFileSync(efwSrc, tmpEfw);
  if (fs.existsSync(folderSrc)) fs.copyFileSync(folderSrc, tmpFolder);

  const running = await containerRunning();
  if (!running) {
    return {
      ok: false,
      published: false,
      rows: rows.length,
      message: `SQLite actualizado (${rows.length} módulos) y seed local escrito, pero el contenedor ${CONTAINER} no está en ejecución. Levantá Docker y volvé a publicar.`,
      seedPath,
    };
  }

  await ensureRemoteDir();
  await dockerCp(tmpHtml, `${DEST_DIR}/dashboard.html`);
  if (fs.existsSync(tmpEfw)) await dockerCp(tmpEfw, `${DEST_DIR}/Gerencia_SIRH.efw`);
  if (fs.existsSync(tmpFolder)) await dockerCp(tmpFolder, `${DEST_DIR}/index.efwfolder`);

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) { /* noop */ }

  return {
    ok: true,
    published: true,
    rows: rows.length,
    message: `Publicado en Helical (${rows.length} módulos). En D6 abrí Gerencia → Dashboard SIRH (o recargá el iframe).`,
    seedPath,
  };
}

module.exports = {
  publishSirhToHelical,
  injectDataBlock,
  rowsToDataLiteral,
};
