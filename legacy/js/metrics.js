export function getAverageScore(person) {
    if (person.compromiso !== undefined) {
        return Math.round((person.compromiso + person.respuesta + person.capacidad + person.conocimiento) / 4);
    }
    return person.score || 0;
}

export function calculateWorkload(state, personName) {
    if (!personName) return { total: 0, count: 0 };
    const assigned = state.sistemas.filter(s => s.team && s.team.split(', ').includes(personName));
    let score = 0;
    assigned.forEach(s => {
        const priority = s.priority || 'Baja';
        if (priority === 'Alta') score += 40;
        else if (priority === 'Media') score += 20;
        else score += 10;
    });
    const managedProviders = getManagedProviders(state, personName);
    score += managedProviders.length * 15;
    return { total: score, count: assigned.length };
}

export function getManagedProviders(state, personName) {
    if (!personName) return [];
    return state.proveedores.filter(p => p.team && p.team.split(', ').includes(personName));
}

export function getCriticalSystemsCount(state) {
    return state.sistemas.filter(s => s.priority === 'Alta').length;
}

export function getPipelineProgress(state) {
    return state.requests.length > 0
        ? Math.round(state.requests.reduce((acc, r) => acc + (r.progress || 0), 0) / state.requests.length)
        : 0;
}

export function getTeamCapacity(state) {
    return state.ranking.length > 0
        ? Math.round(state.ranking.reduce((acc, r) => acc + getAverageScore(r), 0) / state.ranking.length)
        : 0;
}

export function getAverageWorkload(state) {
    const workloadValues = state.ranking.map(p => calculateWorkload(state, p.name).total);
    return workloadValues.length > 0
        ? Math.round(workloadValues.reduce((acc, val) => acc + val, 0) / workloadValues.length)
        : 0;
}
