export function getPriorityColors(p) {
    if (p === 'Alta') return { bg: 'bg-red-50', text: 'text-red-700', border: 'bg-red-500' };
    if (p === 'Media') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'bg-amber-500' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'bg-emerald-500' };
}

export function getPriorityClass(p) {
    if (p === 'Alta') return 'bg-red-100 text-red-700 border-red-200';
    if (p === 'Media') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

export function getStatusColor(status) {
    const statusColorMap = {
        Finalizado: '#10b981', Terminado: '#10b981', Pruebas: '#008cc7',
        Alcance: '#f59e0b', Desarrollo: '#131b2e', Backlog: '#64748b', Pendiente: '#94a3b8',
    };
    if (statusColorMap[status]) return statusColorMap[status];
    const vibrantPalette = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#06b6d4', '#14b8a6', '#f97316'];
    let hash = 0;
    const str = status || '';
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    return vibrantPalette[Math.abs(hash) % vibrantPalette.length];
}

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
