/** Help SIRH-only. */
import { runSystemDiagnostics } from '../board/diagnostics.js';

let currentSection = 'overview';

const SECTION_HELP = {
  overview: {
    title: 'Hoy',
    see: 'KPIs de módulos activos: total, riesgo, avance y vencidos.',
    do: 'Editá el catálogo en Módulos; desactivá lo que no deba verse aquí.',
  },
  informe: {
    title: 'Informe Gerencial',
    see: 'Resumen del catálogo SIRH para dirección.',
    do: 'Exportá PDF desde la barra superior.',
  },
  gerencia: {
    title: 'Tablero',
    see: 'Tablero del catálogo activo: filtros por área/estado/riesgo, gráficos y detalle.',
    do: 'Filtrá por área; editá o activá/desactivá en Módulos.',
  },
  equipo: {
    title: 'Equipo (por módulos)',
    see: 'Personas que figuran como responsable o equipo en módulos activos.',
    do: 'Usá el formulario para agregar persona a un módulo, o abrí el módulo para editar.',
  },
  proveedores: {
    title: 'Proveedores (por módulos)',
    see: 'Proveedores del campo Proveedor de cada módulo.',
    do: 'Asigná un proveedor a un módulo con el formulario, o abrí el módulo para editar.',
  },
  sirh: {
    title: 'Módulos (catálogo unificado)',
    see: 'Catálogo SIRH con ABM en SQLite.',
    do: 'Alta, edición, desactivar o eliminar. Opcional: responsable, proveedor y equipo.',
  },
  admin: {
    title: 'Administración',
    see: 'Marca y preferencias locales.',
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
        <li><strong>Hoy</strong> — foco diario (riesgos, vencidos, avance).</li>
        <li><strong>Módulos SIRH</strong> — catálogo y personas (Equipo / Proveedores en pestañas).</li>
        <li><strong>Tablero</strong> — vista filtrable del mismo catálogo.</li>
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
        <li>Revisar Tablero (riesgos y vencidos).</li>
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
    openHelpModal,
    closeHelpModal,
    toggleHelpModal,
    setHelpSection,
    runSystemDiagnostics,
  });
}
