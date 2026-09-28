import { getState } from '../store.js';
import { calculateWorkload, getManagedProviders } from '../metrics.js';

function exportToCSV(type) {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (type === 'ranking') {
        csvContent += "Nombre,Score,Departamento,Compromiso,Respuesta,Capacidad,Conocimiento\n";
        getState().ranking.forEach(r => {
            const score = Math.round(((r.compromiso || 0) + (r.respuesta || 0) + (r.capacidad || 0) + (r.conocimiento || 0)) / 4);
            csvContent += `"${r.name}",${score},"${r.dept}",${r.compromiso || 0},${r.respuesta || 0},${r.capacidad || 0},${r.conocimiento || 0}\n`;
        });
    } else if (type === 'sistemas') {
        csvContent += "Sistema,Prioridad,Equipo,Descripcion\n";
        getState().sistemas.forEach(s => {
            csvContent += `"${s.name}","${s.priority}","${s.team}","${s.desc}"\n`;
        });
    } else if (type === 'incidents' || type === 'unattended') {
        csvContent += "Semaforo,Titulo,Status/Motivo,Descripcion\n";
        getState().unattended.forEach(u => {
            csvContent += `"${u.priority || 'Alta'}","${u.title}","${u.status}","${u.desc.replace(/"/g, '""')}"\n`;
        });
    } else if (type === 'pipeline' || type === 'requests') {
        csvContent += "Requerimiento,EXPTE,Prioridad,Progreso,Status\n";
        getState().requests.forEach(r => {
            csvContent += `"${r.feature}","${r.expte}","${r.priority}",${r.progress},"${r.status}"\n`;
        });
    } else if (type === 'asignacion') {
        csvContent += "Persona,Departamento,Sistemas Asignados,Proveedores Gestionados,Carga de Trabajo\n";
        getState().ranking.forEach(p => {
            const assigned = getState().sistemas.filter(s => s.team && s.team.includes(p.name)).map(s => s.name).join("; ");
            const providers = getManagedProviders(getState(), p.name).map(pr => pr.name).join("; ");
            const workload = calculateWorkload(getState(), p.name).total;
            csvContent += `"${p.name}","${p.dept}","${assigned}","${providers}",${workload}\n`;
        });
    } else if (type === 'proveedores') {
        csvContent += "Proveedor,Rubro,Estado,Contacto,Email,Telefono,Responsables,Sistemas Vinculados,Incidencias Vinculadas,Tareas Pendientes,Tareas Completadas,Nro Contrato,Vencimiento Contrato,Condicion de Pago\n";
        getState().proveedores.forEach(p => {
            const tasks = Array.isArray(p.tasks) ? p.tasks : [];
            const pending = tasks.filter(t => !t.done).length;
            const done = tasks.filter(t => t.done).length;
            csvContent += `"${p.name || ''}","${p.rubro || ''}","${p.status || ''}","${p.contactPerson || ''}","${p.email || ''}","${p.phone || ''}","${p.team || ''}","${p.linkedSystems || ''}","${p.linkedIncidents || ''}",${pending},${done},"${p.contractNumber || ''}","${p.contractExpiry || ''}","${p.paymentTerms || ''}"\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export { exportToCSV };
