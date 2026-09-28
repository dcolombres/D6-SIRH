import { runSystemDiagnostics } from '../board/diagnostics.js';

let currentSection = 'overview';

const SECTION_HELP = {
  overview: {
    title: 'Hoy (D6 · SIRH)',
    see: 'KPIs de módulos SIRH: total, riesgo alto, avance medio y vencidos, con gráficos.',
    do: 'Saltá a Módulos para editar o a Gerencia para el tablero.',
  },
  operacion: {
    title: 'Operación',
    see: 'Sistemas, incidencias y solicitudes (secundario).',
    do: 'Usá las pestañas para cargar y priorizar ítems operativos.',
  },
  sistemas: {
    title: 'Sistemas',
    see: 'Matriz por prioridad Alta / Media / Baja.',
    do: 'Agregá o editá sistemas y asigná responsables.',
  },
  incidents: {
    title: 'Incidencias',
    see: 'Incidentes abiertos y cerrados.',
    do: 'Registrá, priorizá y cerrá cuando estén resueltos.',
  },
  pipeline: {
    title: 'Solicitudes',
    see: 'Expedientes con progreso y estado.',
    do: 'Actualizá avance y cerrá cuando corresponda.',
  },
  proveedores: {
    title: 'Proveedores',
    see: 'Fichas, vínculos y tareas (secundario).',
    do: 'Mantené contactos y seguimiento de pendientes.',
  },
  reports: {
    title: 'Reportes SIRH',
    see: 'CSV de módulos SQLite y exportes de operación.',
    do: 'Exportá módulos o abrí Gerencia / Informe.',
  },
  informe: {
    title: 'Informe Gerencial',
    see: 'Pantallazo global con KPIs para Gerencia General.',
    do: 'Exportá PDF desde la barra superior.',
  },
  gerencia: {
    title: 'Gerencia SIRH',
    see: 'Tablero nativo con KPIs, filtros, gráficos y detalle de módulos (misma data SQLite).',
    do: 'Filtrá por estado/riesgo; editá en Módulos si hace falta actualizar un dato.',
  },
  sirh: {
    title: 'Módulos SIRH (ABM)',
    see: 'Alta/edición de módulos en SQLite: estados, fechas, responsable y proveedor.',
    do: 'Guardá cambios y abrí Gerencia o Hoy para ver el impacto.',
  },
  admin: {
    title: 'Administración',
    see: 'Marca, etiquetas y preferencias locales.',
    do: 'Ajustá identidad visual; los módulos viven en SQLite.',
  },
};

export function setHelpSection(sectionId) {
  currentSection = sectionId || 'overview';
}

function syncBlock() {
  return `
    <section class="space-y-3">
      <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">Flujo SIRH</h3>
      <ol class="list-decimal pl-5 text-sm space-y-2">
        <li><strong>Hoy</strong> — KPIs y foco de riesgos/vencidos.</li>
        <li><strong>Módulos</strong> — ABM en SQLite.</li>
        <li><strong>Gerencia</strong> — tablero filtrable para dirección.</li>
        <li><strong>Reportes</strong> — CSV de módulos u operación.</li>
      </ol>
    </section>
  `;
}

function weeklyBlock() {
  return `
    <section class="space-y-3">
      <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">Checklist semanal</h3>
      <ul class="list-disc pl-5 text-sm space-y-1">
        <li>Actualizar estados y fechas en Módulos.</li>
        <li>Revisar Gerencia (riesgos y vencidos).</li>
        <li>Exportar CSV SIRH si hace falta compartir.</li>
      </ul>
    </section>
  `;
}

export function openHelpModal() {
  const modal = document.getElementById('help-modal');
  const content = document.getElementById('readme-content');
  if (!modal) return;
  const help = SECTION_HELP[currentSection] || SECTION_HELP.overview;
  if (content) {
    content.innerHTML = `
      <section class="space-y-3">
        <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">${help.title}</h3>
        <p class="text-sm"><strong>Qué veo:</strong> ${help.see}</p>
        <p class="text-sm"><strong>Qué hago:</strong> ${help.do}</p>
      </section>
      ${syncBlock()}
      ${weeklyBlock()}
      <section class="space-y-3">
        <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">Diagnóstico</h3>
        <button type="button" onclick="runSystemDiagnostics()" class="bg-surface-container-highest text-on-surface px-6 py-2 rounded-xl font-bold text-xs uppercase hover:bg-surface-dim transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">precision_manufacturing</span>
          Ejecutar Diagnóstico
        </button>
        <div id="diagnostics-results" class="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 hidden"></div>
      </section>
    `;
  }
  modal.classList.remove('hidden');
}

export function closeHelpModal() {
  document.getElementById('help-modal')?.classList.add('hidden');
}

export function toggleHelpModal() {
  const modal = document.getElementById('help-modal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) openHelpModal();
  else closeHelpModal();
}

export function wireHelpGlobals() {
  Object.assign(window, {
    toggleHelpModal,
    openHelpModal,
    closeHelpModal,
    runSystemDiagnostics,
  });
}
