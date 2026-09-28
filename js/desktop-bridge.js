/**
 * Bridge web: API local del servidor Node (window.d6Api).
 * Alias window.ddsDesktop por compatibilidad con código previo.
 */
(function initD6ApiBridge() {
  if (window.d6Api) return;

  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && data && data.error) {
      return data;
    }
    return data;
  }

  const bridge = {
    openExternal: (url) => {
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return Promise.resolve();
      }
      return Promise.reject(new Error('URL inválida'));
    },
    sirhList: async () => {
      const data = await api('/api/sirh/modulos');
      return data.rows || [];
    },
    sirhUpsert: (payload) => api('/api/sirh/modulos', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
    sirhDelete: (id) => api(`/api/sirh/modulos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    sirhCatalogos: () => api('/api/sirh/catalogos'),
    sirhDbPath: async () => {
      const data = await api('/api/sirh/db-path');
      return data.path || '';
    },
    sirhStats: async () => {
      const data = await api('/api/sirh/stats');
      return data.stats || null;
    },
    sirhExport: async () => {
      const data = await api('/api/sirh/export');
      return data.sirh_modulos || [];
    },
    sirhImport: (sirh_modulos) => api('/api/sirh/import', {
      method: 'POST',
      body: JSON.stringify({ sirh_modulos: sirh_modulos || [] }),
    }),
  };

  window.d6Api = bridge;
  window.ddsDesktop = bridge;
})();
