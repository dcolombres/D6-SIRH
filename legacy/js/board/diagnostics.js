import { getState } from '../store.js';

function runSystemDiagnostics() {
  const api = window.d6Api || window.ddsDesktop;
  const checks = {
    store: !!getState()?.settings,
    localStorage: !!window.localStorage,
    sirhBridge: typeof api?.sirhList === 'function',
    overviewDom: !!document.getElementById('section-overview') || !!document.getElementById('sirh-tbody') || !!document.getElementById('gerencia-kpis'),
  };

  let html = '<div class="space-y-2 mt-2 text-[10px] font-data uppercase">';
  for (const [check, passed] of Object.entries(checks)) {
    html += `<div class="flex justify-between border-b border-outline-variant/10 pb-1"><span>${check}:</span> <span class="${passed ? 'text-emerald-600' : 'text-error'} font-bold">${passed ? 'OK' : 'FAIL'}</span></div>`;
  }
  html += '</div>';

  const resultsContainer = document.getElementById('diagnostics-results');
  if (resultsContainer) {
    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
  }

  if (Object.values(checks).every(Boolean)) {
    alert('Diagnóstico SIRH: comprobaciones básicas OK.');
  } else {
    alert('Diagnóstico: hay fallos. Revisá los resultados y que npm start esté corriendo.');
  }
}

export { runSystemDiagnostics };
