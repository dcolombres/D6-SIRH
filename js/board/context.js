export const editIndices = {
    ranking: null,
    sistemas: null,
    unattended: null,
    requests: null,
    modalSistemas: null,
    proveedores: null,
    providerTask: null,
};

let _currentProviderIndex = null;

export function getCurrentProviderIndex() {
    return _currentProviderIndex;
}

export function setCurrentProviderIndex(value) {
    _currentProviderIndex = value;
}

/** @deprecated use getCurrentProviderIndex — kept for read-only live binding via getter object */
export const providerCtx = {
    get index() {
        return _currentProviderIndex;
    },
    set index(v) {
        _currentProviderIndex = v;
    },
};

export let selectedProviderTeam = [];
export let selectedProviderSystems = [];
export let selectedProviderIncidents = [];

export let selectedModalTeam = [];
export let selectedTeam = [];

export const viewState = {
    asignacionView: 'cards',
    asignacionSort: { col: 'workload', dir: 'desc' },
    hubView: 'cards',
    incidentsSort: { col: 'priority', dir: 'asc' },
    sistemasView: 'cards',
    sistemasSort: { col: 'priority', dir: 'asc' },
    pipelineView: 'table',
    pipelineSort: { col: 'progress', dir: 'desc' },
    rankingView: 'table',
    rankingSort: { col: 'score', dir: 'desc' },
    proveedoresView: 'cards',
    proveedoresSort: { col: 'name', dir: 'asc' },
};
