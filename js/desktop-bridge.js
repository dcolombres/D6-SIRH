/**
 * Bridge web: mismo shape que Electron preload (window.ddsDesktop).
 * Usa la API local del servidor Node.
 */
(function initDdsDesktopBridge() {
  if (window.ddsDesktop) return;

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

  window.ddsDesktop = {
    openExternal: (url) => {
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return Promise.resolve();
      }
      return Promise.reject(new Error('URL inválida'));
    },
    pingHelical: (url) => api(`/api/helical/ping?url=${encodeURIComponent(url || '')}`),
    sirhList: async () => {
      const data = await api('/api/sirh/modulos');
      return data.rows || [];
    },
    sirhUpsert: (payload) => api('/api/sirh/modulos', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),
    sirhDelete: (id) => api(`/api/sirh/modulos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    sirhPublish: () => api('/api/sirh/publish', { method: 'POST', body: '{}' }),
    sirhCatalogos: () => api('/api/sirh/catalogos'),
    sirhDbPath: async () => {
      const data = await api('/api/sirh/db-path');
      return data.path || '';
    },
    sirhStats: async () => {
      const data = await api('/api/sirh/stats');
      return data.stats || null;
    },
  };
})();
