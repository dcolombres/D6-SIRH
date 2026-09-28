import { getState } from './store.js';
import {
  buildMagicReportItems,
  buildMagicReportMeta,
  hasMeaningfulReportContent,
} from './magic-report.js';

let reportItems = [];

let isPreview = false;
const COLOR_OPTIONS = ['#004ac6', '#006c4a', '#ab0b1c', '#737686', '#fbbf24', '#8b5cf6'];

function initReportStudio() { // Renamed init to avoid collision
    const today = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('current-date').innerText = today;

    const savedData = localStorage.getItem('report_studio_v3_state');
    if (savedData) {
        const savedReport = JSON.parse(savedData);
        document.getElementById('report-title').value = savedReport.title || '';
        document.getElementById('author-name').value = savedReport.author || '';
        document.getElementById('authority-name').value = savedReport.authority || '';
        reportItems = savedReport.items || savedReport.reportItems || [];
    } else {
        reportItems = [{
            id: Date.now(),
            title: '',
            description: '',
            tags: [{ text: 'Borrador', color: '#004ac6' }],
            image: null
        }];
    }
    window.items = reportItems;
    renderItems();
}

function renderItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    reportItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'item-card report-section group relative bg-white border border-outline-variant/60 rounded-xl transition-all-custom hover:shadow-md';
        card.setAttribute('data-id', item.id);
        const accent = (item.tags && item.tags[0] && item.tags[0].color) || '#111111';
        card.style.borderLeftColor = accent;

        const tagsHtml = (item.tags || []).map((tag, tagIndex) => `
            <div class="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container rounded-full border border-outline-variant/30 text-[11px] font-medium" style="border-left: 3px solid ${tag.color}">
                <span class="text-on-surface">${tag.text}</span>
                <div class="edit-control flex items-center gap-1 ml-1">
                    <select onchange="updateTagColor(${index}, ${tagIndex}, this.value)" class="w-3 h-3 rounded-full border-none p-0 cursor-pointer appearance-none bg-transparent" style="background-color: ${tag.color}">
                        ${COLOR_OPTIONS.map(c => `<option value="${c}" ${c === tag.color ? 'selected' : ''} style="background-color: ${c}"></option>`).join('')}
                    </select>
                    <button class="hover:text-error flex items-center" onclick="removeTag(${index}, ${tagIndex})">
                        <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
                    </button>
                </div>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="flex gap-4 item-card-inner">
                <div class="edit-control flex flex-col gap-1 items-center text-outline-variant/40 group-hover:text-outline transition-colors">
                    <button onclick="moveItem(${index}, -1)" class="p-0.5 hover:bg-surface-container rounded-md ${index === 0 ? 'opacity-10 pointer-events-none' : ''}">
                        <span class="material-symbols-outlined" style="font-size: 20px;">expand_less</span>
                    </button>
                    <span class="material-symbols-outlined drag-handle" style="font-size: 18px;">drag_indicator</span>
                    <button onclick="moveItem(${index}, 1)" class="p-0.5 hover:bg-surface-container rounded-md ${index === reportItems.length - 1 ? 'opacity-10 pointer-events-none' : ''}">
                        <span class="material-symbols-outlined" style="font-size: 20px;">expand_more</span>
                    </button>
                </div>

                <div class="flex-grow flex flex-col gap-4">
                    <div class="flex justify-between items-start gap-4">
                        <input type="text" placeholder="Título de Sección" value="${item.title}"
                            class="section-title-input flex-grow bg-transparent border-none p-0 focus:ring-0 placeholder:opacity-30"
                            oninput="updateItem(${index}, 'title', this.value)">

                        <div class="flex flex-wrap items-center gap-2">
                            <div class="flex flex-wrap gap-1.5" id="tags-container-${index}">
                                ${tagsHtml}
                            </div>
                            <div class="add-tag-container flex items-center bg-surface-container rounded-full px-2 border border-outline-variant focus-within:ring-1 focus-within:ring-primary/40">
                                <input type="text" placeholder="Tag..."
                                    class="bg-transparent border-none py-0.5 px-0.5 w-12 text-[10px] focus:ring-0 placeholder:opacity-50"
                                    onkeydown="handleTagKey(event, ${index})">
                                <button class="text-primary/60 hover:text-primary" onclick="addTagFromInput(this, ${index})">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">add_circle</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="rich-text-wrapper border border-transparent focus-within:border-outline-variant/30 rounded-lg transition-all">
                        <div class="rich-text-toolbar flex items-center gap-1 p-1 bg-surface-container-low border-b border-outline-variant/30 rounded-t-lg edit-control">
                            <button onclick="execCommand('bold')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_bold</span></button>
                            <button onclick="execCommand('italic')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_italic</span></button>
                            <div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
                            <button onclick="execCommand('justifyLeft')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_align_left</span></button>
                            <button onclick="execCommand('justifyCenter')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_align_center</span></button>
                            <button onclick="execCommand('justifyRight')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_align_right</span></button>
                            <div class="w-[1px] h-4 bg-outline-variant mx-1"></div>
                            <button onclick="execCommand('insertUnorderedList')" class="p-1 hover:bg-surface-container rounded text-on-surface-variant"><span class="material-symbols-outlined" style="font-size: 18px;">format_list_bulleted</span></button>
                        </div>
                        <div contenteditable="true"
                            class="rich-text-content w-full text-body-md"
                            data-placeholder="Escriba aquí los detalles del reporte..."
                            oninput="updateItem(${index}, 'description', this.innerHTML)">${item.description || ''}</div>
                    </div>

                    <div class="mt-1">
                        ${item.image ? `
                            <div class="relative w-48 rounded-lg overflow-hidden group/img bg-surface-container-low border border-outline-variant/20 shadow-sm">
                                <img src="${item.image}" class="w-full h-32 object-cover">
                                <button onclick="removeImage(${index})" class="edit-control absolute top-2 right-2 p-1.5 bg-error/90 text-on-error rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                                </button>
                            </div>
                        ` : `
                            <label class="upload-placeholder flex items-center justify-center w-32 h-10 border-2 border-dashed border-outline-variant/30 rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors bg-surface-container-lowest/50">
                                <div class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-outline-variant" style="font-size: 20px;">add_photo_alternate</span>
                                    <span class="text-[10px] text-outline font-bold uppercase">Imagen</span>
                                </div>
                                <input type="file" class="hidden" accept="image/*" onchange="handleImage(event, ${index})">
                            </label>
                        `}
                    </div>
                </div>

                <button onclick="deleteItem(${index})" class="delete-btn text-outline-variant/30 hover:text-error transition-colors p-1 h-fit">
                    <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function execCommand(command) {
    document.execCommand(command, false, null);
}

function togglePreview() {
    isPreview = !isPreview;
    document.body.classList.toggle('preview-mode', isPreview);
    const btn = document.getElementById('preview-toggle');
    const text = document.getElementById('preview-text');
    const icon = btn.querySelector('.material-symbols-outlined');

    if (isPreview) {
        text.innerText = 'Editar';
        icon.innerText = 'edit';
        btn.classList.add('bg-primary-container/10', 'text-primary');
    } else {
        text.innerText = 'Previsualizar';
        icon.innerText = 'visibility';
        btn.classList.remove('bg-primary-container/10', 'text-primary');
    }
}

function addItem() {
    reportItems.push({
        id: Date.now(),
        title: '',
        description: '',
        tags: [{ text: 'Nuevo', color: '#737686' }],
        image: null
    });
    renderItems();
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
}

function deleteItem(index) {
    if(confirm('¿Eliminar esta sección?')) {
        reportItems.splice(index, 1);
        renderItems();
        autoSaveReportStudio(); // Renamed autoSave to avoid collision
    }
}

function updateItem(index, key, value) {
    reportItems[index][key] = value;
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
}

function handleTagKey(event, index) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTagFromInput(event.target.nextElementSibling, index);
    }
}

function addTagFromInput(button, index) {
    const input = button.previousElementSibling;
    const value = input.value.trim();
    if (value) {
        if (!reportItems[index].tags) reportItems[index].tags = [];
        reportItems[index].tags.push({ text: value, color: COLOR_OPTIONS[0] });
        input.value = '';
        renderItems();
        autoSaveReportStudio(); // Renamed autoSave to avoid collision
    }
}

function updateTagColor(itemIndex, tagIndex, color) {
    reportItems[itemIndex].tags[tagIndex].color = color;
    renderItems();
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
}

function removeTag(itemIndex, tagIndex) {
    reportItems[itemIndex].tags[tagIndex] = null;
    reportItems[itemIndex].tags.splice(tagIndex, 1);
    renderItems();
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
}

function moveItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < reportItems.length) {
        [reportItems[index], reportItems[newIndex]] = [reportItems[newIndex], reportItems[index]];
        renderItems();
        autoSaveReportStudio(); // Renamed autoSave to avoid collision
    }
}

function handleImage(event, index) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            reportItems[index].image = e.target.result;
            renderItems();
            autoSaveReportStudio(); // Renamed autoSave to avoid collision
        };
        reader.readAsDataURL(file);
    }
}

function removeImage(index) {
    reportItems[index].image = null;
    renderItems();
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
}

function clearReport() {
    if(confirm('¿Está seguro de que desea limpiar todo el reporte? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('report_studio_v3_state');
        document.getElementById('report-title').value = '';
        document.getElementById('author-name').value = '';
        document.getElementById('authority-name').value = '';
        reportItems = [{
            id: Date.now(),
            title: '',
            description: '',
            tags: [{ text: 'Borrador', color: '#004ac6' }],
            image: null
        }];
        window.items = reportItems;
        renderItems();
    }
}

function autoSaveReportStudio() { // Renamed autoSave to avoid collision
    const reportSnapshot = {
        title: document.getElementById('report-title').value,
        author: document.getElementById('author-name').value,
        authority: document.getElementById('authority-name').value,
        items: reportItems,
    };
    localStorage.setItem('report_studio_v3_state', JSON.stringify(reportSnapshot));
}

function saveReportState() {
    autoSaveReportStudio(); // Renamed autoSave to avoid collision
    const btn = event.currentTarget;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">check</span> Guardado';
    setTimeout(() => btn.innerHTML = originalHtml, 2000);
}

function htmlToPdfBlocks(html) {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const blocks = [];

    function push(type, text) {
        const t = String(text || '').replace(/\s+/g, ' ').trim();
        if (t) blocks.push({ type, text: t });
    }

    Array.from(doc.body.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            push('p', node.textContent);
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toLowerCase();
        if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
            push('h', node.textContent);
            return;
        }
        if (tag === 'p' || tag === 'div') {
            push('p', node.textContent);
            return;
        }
        if (tag === 'ul' || tag === 'ol') {
            Array.from(node.children).forEach((li) => {
                if (li.tagName && li.tagName.toLowerCase() === 'li') {
                    push('li', li.textContent);
                }
            });
            return;
        }
        push('p', node.textContent);
    });
    return blocks;
}

function htmlToStructuredText(html) {
    return htmlToPdfBlocks(html)
        .map((b) => (b.type === 'li' ? `• ${b.text}` : b.type === 'h' ? b.text.toUpperCase() : b.text))
        .join('\n\n');
}

function stripHtml(html) {
    return htmlToStructuredText(html);
}

function ensurePdfSpace(pdf, yOffset, needed, marginTop = 20) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (yOffset + needed > pageHeight - 18) {
        pdf.addPage();
        return marginTop;
    }
    return yOffset;
}

function stampPdfPages(pdf, author, authority) {
    const total = pdf.internal.getNumberOfPages();
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Elaborado por: ${author}  ·  Dirigido a: ${authority}`, 15, pdfHeight - 10);
        pdf.text(`Página ${i} / ${total}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
    }
    pdf.setTextColor(0, 0, 0);
}

async function exportToPDF() {
    const isLocal = window.location.protocol === 'file:';
    if (isLocal) {
        alert('La exportación a PDF requiere servir la app por HTTP (npm start / Electron).');
        return;
    }

    const wasPreview = isPreview;
    if (!wasPreview) togglePreview();

    const exportButton = document.getElementById('export-pdf-button');
    const exportIcon = document.getElementById('export-pdf-icon');
    const exportText = document.getElementById('export-pdf-text');
    const exportSpinner = document.getElementById('export-pdf-spinner');
    if (exportButton) exportButton.disabled = true;
    if (exportText) exportText.innerText = 'Generando PDF...';
    if (exportSpinner) exportSpinner.classList.remove('hidden');
    if (exportIcon) exportIcon.classList.add('hidden');

    let isSuccess = false;
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        let yOffset = 20;

        const title = document.getElementById('report-title').value || 'Reporte Corporativo';
        const author = document.getElementById('author-name').value || 'Responsable';
        const authority = document.getElementById('authority-name').value || 'Autoridad';
        const currentDate = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
        const stamp = new Date().toISOString().slice(0, 10);
        const isMagicTitle = /^Status\s/i.test(title) || /Magic Report/i.test(title);
        const fileName = isMagicTitle
            ? `dds_status_${stamp}.pdf`
            : `${title.replace(/\s+/g, '_')}.pdf`;

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const titleLines = pdf.splitTextToSize(title, pdfWidth - 30);
        pdf.text(titleLines, pdfWidth / 2, yOffset, { align: 'center' });
        yOffset += titleLines.length * 7 + 2;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${currentDate}`, pdfWidth / 2, yOffset, { align: 'center' });
        yOffset += 5;
        pdf.setFontSize(9);
        pdf.setTextColor(90, 90, 90);
        pdf.text(`Elaborado por ${author}  ·  Dirigido a ${authority}`, pdfWidth / 2, yOffset, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        yOffset += 12;

        if (reportItems && reportItems.length > 0) {
            for (const reportItem of reportItems) {
                yOffset = ensurePdfSpace(pdf, yOffset, 32);

                pdf.setFontSize(13);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(20, 20, 20);
                pdf.text(reportItem.title || 'Sección', 15, yOffset);
                yOffset += 3;
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.3);
                pdf.line(15, yOffset, pdfWidth - 15, yOffset);
                yOffset += 7;

                const blocks = htmlToPdfBlocks(reportItem.description);
                if (!blocks.length) {
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(120, 120, 120);
                    pdf.text('—', 15, yOffset);
                    pdf.setTextColor(0, 0, 0);
                    yOffset += 6;
                }

                for (const block of blocks) {
                    if (block.type === 'h') {
                        yOffset = ensurePdfSpace(pdf, yOffset, 12);
                        yOffset += 2;
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(40, 40, 40);
                        const heading = pdf.splitTextToSize(block.text.toUpperCase(), pdfWidth - 30);
                        for (const line of heading) {
                            yOffset = ensurePdfSpace(pdf, yOffset, 7);
                            pdf.text(line, 15, yOffset);
                            yOffset += 4.5;
                        }
                        yOffset += 2;
                        continue;
                    }

                    if (block.type === 'li') {
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(30, 30, 30);
                        const bulletLines = pdf.splitTextToSize(block.text, pdfWidth - 42);
                        bulletLines.forEach((line, i) => {
                            yOffset = ensurePdfSpace(pdf, yOffset, 7);
                            if (i === 0) {
                                pdf.text('•', 17, yOffset);
                                pdf.text(line, 22, yOffset);
                            } else {
                                pdf.text(line, 22, yOffset);
                            }
                            yOffset += 5;
                        });
                        yOffset += 1.5;
                        continue;
                    }

                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(30, 30, 30);
                    const paraLines = pdf.splitTextToSize(block.text, pdfWidth - 30);
                    for (const line of paraLines) {
                        yOffset = ensurePdfSpace(pdf, yOffset, 7);
                        pdf.text(line, 15, yOffset);
                        yOffset += 5;
                    }
                    yOffset += 3;
                }

                if (reportItem.image) {
                    const imgHeight = 40;
                    yOffset = ensurePdfSpace(pdf, yOffset, imgHeight + 10);
                    pdf.addImage(reportItem.image, 'PNG', 15, yOffset, 60, imgHeight);
                    yOffset += imgHeight + 10;
                }

                yOffset += 8;
            }
        } else {
            pdf.setFontSize(12);
            pdf.setTextColor(150, 150, 150);
            pdf.text('No hay datos disponibles para el reporte.', pdfWidth / 2, yOffset + 30, { align: 'center' });
            pdf.text('Ejecutá Magic Report para generar el status.', pdfWidth / 2, yOffset + 40, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
        }

        stampPdfPages(pdf, author, authority);
        pdf.save(fileName);
        isSuccess = true;

        if (exportIcon) {
            exportIcon.innerText = 'check';
            exportIcon.classList.remove('hidden');
        }
        if (exportText) exportText.innerText = '¡Exportado!';
        if (exportSpinner) exportSpinner.classList.add('hidden');

        setTimeout(() => {
            if (exportIcon) {
                exportIcon.innerText = 'picture_as_pdf';
                exportIcon.classList.remove('hidden');
            }
            if (exportText) exportText.innerText = 'Exportar PDF';
            if (exportSpinner) exportSpinner.classList.add('hidden');
        }, 2000);
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Error al generar el PDF. Revisá la consola (F12).');
    } finally {
        if (exportButton) exportButton.disabled = false;
        if (!isSuccess) {
            if (exportIcon) {
                exportIcon.innerText = 'picture_as_pdf';
                exportIcon.classList.remove('hidden');
            }
            if (exportText) exportText.innerText = 'Exportar PDF';
            if (exportSpinner) exportSpinner.classList.add('hidden');
        }
        if (!wasPreview && isPreview) {
            togglePreview();
        }
    }
}

function flashMagicFeedback(ok) {
    const btn = document.getElementById('magic-report-button');
    const label = document.getElementById('magic-report-text');
    if (!btn || !label) return;
    const original = label.textContent;
    label.textContent = ok ? '¡Status listo!' : 'Error';
    btn.classList.toggle('opacity-70', !ok);
    setTimeout(() => {
        label.textContent = original;
        btn.classList.remove('opacity-70');
    }, 2200);
}

function loadDDSDataIntoReport() {
    try {
        const state = getState();
        if (!state || !Array.isArray(state.sistemas)) {
            throw new Error('Estado del tablero no disponible');
        }

        if (hasMeaningfulReportContent(reportItems)) {
            const ok = confirm('Esto reemplaza el contenido actual del Report Studio. ¿Continuar?');
            if (!ok) return;
        }

        const authorityInput = document.getElementById('authority-name');
        const meta = buildMagicReportMeta(state, authorityInput?.value || '');
        reportItems = buildMagicReportItems(state);
        window.items = reportItems;

        const titleEl = document.getElementById('report-title');
        const authorEl = document.getElementById('author-name');
        if (titleEl) titleEl.value = meta.title;
        if (authorEl) authorEl.value = meta.author;
        if (authorityInput) authorityInput.value = meta.authority;

        renderItems();
        autoSaveReportStudio();
        flashMagicFeedback(true);
    } catch (error) {
        console.error('Magic Report error:', error);
        flashMagicFeedback(false);
        alert('No se pudo generar el Magic Report. Revisá la consola (F12).');
    }
}


export {
    initReportStudio, renderItems, execCommand, togglePreview, addItem, deleteItem,
    updateItem, handleTagKey, addTagFromInput, updateTagColor, removeTag, moveItem,
    handleImage, removeImage, clearReport, autoSaveReportStudio, saveReportState,
    exportToPDF, stripHtml, loadDDSDataIntoReport,
};

export function wireReportStudioGlobals() {
    window.items = reportItems;
    window.initReportStudio = initReportStudio;
    window.renderItems = renderItems;
    window.execCommand = execCommand;
    window.togglePreview = togglePreview;
    window.addItem = addItem;
    window.deleteItem = deleteItem;
    window.updateItem = updateItem;
    window.handleTagKey = handleTagKey;
    window.addTagFromInput = addTagFromInput;
    window.updateTagColor = updateTagColor;
    window.removeTag = removeTag;
    window.moveItem = moveItem;
    window.handleImage = handleImage;
    window.removeImage = removeImage;
    window.clearReport = clearReport;
    window.saveState = saveReportState;
    window.autoSave = autoSaveReportStudio;
    window.exportToPDF = exportToPDF;
    window.loadDDSDataIntoReport = loadDDSDataIntoReport;
}
