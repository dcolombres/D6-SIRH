import { runSystemDiagnostics } from '../board/diagnostics.js';

let currentSection = 'overview';

const SECTION_HELP = {
  overview: {
    title: 'Hoy (D6 · SIRH)',
    see: 'KPIs de módulos SIRH: total, riesgo alto, avance medio y vencidos, con gráficos.',
    do: 'Saltá a Módulos para editar o a Gerencia para el tablero Helical.',
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
  equipo: {
    title: 'Equipo',
    see: 'Sección legacy (oculta en D6).',
    do: 'El foco está en módulos SIRH.',
  },
  ranking: {
    title: 'Ranking',
    see: 'Legacy — no es el eje de D6.',
    do: 'Usá Módulos / Gerencia SIRH.',
  },
  asignacion: {
    title: 'Asignaciones',
    see: 'Legacy — no es el eje de D6.',
    do: 'Usá Módulos / Gerencia SIRH.',
  },
  proveedores: {
    title: 'Proveedores',
    see: 'Fichas, vínculos y tareas (secundario).',
    do: 'Mantené contactos y seguimiento de pendientes.',
  },
  reports: {
    title: 'Reportes SIRH',
    see: 'CSV de módulos SQLite y exportes de operación.',
    do: 'Exportá módulos o abrí Gerencia Helical / Informe.',
  },
  informe: {
    title: 'Informe Gerencial',
    see: 'Pantallazo global con KPIs para Gerencia General.',
    do: 'Exportá PDF desde la barra superior.',
  },
  helical: {
    title: 'Gerencia (Helical)',
    see: 'Tablero EFW embebido con avance de módulos SIRH.',
    do: 'Login Helical → Dashboard. Editá en Módulos y Publicá.',
  },
  sirh: {
    title: 'Módulos SIRH (ABM)',
    see: 'SQLite local: estados, fechas, responsable y proveedor.',
    do: 'Alta/edición/baja y Publicar para sincronizar Helical.',
  },
  admin: {
    title: 'Administración',
    see: 'Marca, etiquetas y conexión Helical/SIRH.',
    do: 'Ajustá identidad y la URL del dashboard Helical.',
  },
};

export function setHelpSection(sectionId) {
  currentSection = sectionId || 'overview';
}

function syncBlock() {
  return `
    <section class="space-y-3">
      <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">Sincronizar entre máquinas</h3>
      <ol class="list-decimal pl-5 text-sm space-y-2">
        <li><strong>Editar</strong> en esta PC.</li>
        <li><strong>Exportar paquete</strong> desde el Centro de Datos (firma con tu nombre).</li>
        <li><strong>Enviar</strong> el JSON (mail, Drive, pendrive).</li>
        <li>En la otra máquina: <strong>Importar</strong>, revisar el resumen y confirmar.</li>
      </ol>
      <p class="text-xs text-on-surface-variant">El import reemplaza todo el tablero (last-write-wins). Hay un deshacer de un nivel.</p>
      <button type="button" onclick="openDataHub(); toggleHelpModal();" class="mt-2 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold uppercase">Abrir Centro de Datos</button>
    </section>
  `;
}

function weeklyBlock() {
  return `
    <section class="space-y-3">
      <h3 class="text-lg font-bold text-primary border-b border-outline-variant pb-2">Checklist del equipo (3 personas)</h3>
      <ul class="list-disc pl-5 text-sm space-y-1">
        <li>Actualizar Operación y Proveedores.</li>
        <li>Exportar paquete firmado.</li>
        <li>Enviar al resto del trío.</li>
        <li>Director: importar y generar Reportes de la semana.</li>
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
