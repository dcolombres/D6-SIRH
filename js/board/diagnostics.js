import { getState } from '../store.js';

function runSystemDiagnostics() {
    console.log("--- INICIANDO DIAGNÓSTICO DE SISTEMA ---");
    const checks = {
        stateIntegrity: !!getState() && Array.isArray(getState().ranking) && Array.isArray(getState().sistemas),
        domElements: !!document.getElementById('list-unattended') && !!document.getElementById('list-requests'),
        localStorage: !!window.localStorage,
        formHandling: !!document.getElementById('form-unattended') && !!document.getElementById('form-requests')
    };
    
    let html = '<div class="space-y-2 mt-2 text-[10px] font-data uppercase">';
    for (const [check, passed] of Object.entries(checks)) {
        html += `<div class="flex justify-between border-b border-outline-variant/10 pb-1"><span>${check}:</span> <span class="${passed ? 'text-emerald-600' : 'text-error'} font-bold">${passed ? 'PASSED' : 'FAILED'}</span></div>`;
    }
    html += '</div>';
    
    const resultsContainer = document.getElementById('diagnostics-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = html;
        resultsContainer.classList.remove('hidden');
    }
    
    console.log("Resultados:", checks);
    if (Object.values(checks).every(v => v)) {
        alert("Sistema saludable: Todas las comprobaciones pasaron correctamente.");
    } else {
        alert("Atención: Se detectaron problemas en el diagnóstico. Revisa los resultados en pantalla.");
    }
}

export { runSystemDiagnostics };
