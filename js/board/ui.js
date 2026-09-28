import { persistState } from '../store.js';
import { getCurrentProviderIndex } from './context.js';
import { renderOverview } from './overview.js';
import { renderRanking } from './ranking.js';
import { renderSistemas, renderTeamSelection } from './sistemas.js';
import { renderStatus } from './incidencias.js';
import { renderAsignacion } from './asignaciones.js';
import {
    renderProveedores, renderProviderTagSelectors, renderProviderTasks,
} from './proveedores.js';

export function updateUI() {
    try {
        renderOverview();
        renderRanking();
        renderSistemas();
        renderStatus();
        renderAsignacion();
        renderTeamSelection();
        renderProveedores();
        if (getCurrentProviderIndex() !== null) {
            renderProviderTagSelectors();
            renderProviderTasks();
        }
    } catch (e) {
        console.error('UI Update Error:', e);
    } finally {
        persistState();
    }
}
