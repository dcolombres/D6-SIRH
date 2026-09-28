import { initAdminStore, getState, setState } from './store.js';
import { applyBrandSettings } from '../brand.js';
import { toggleSidebar } from '../shell.js';
import {
    applyBrand,
    addRole, deleteRole, updateBrandColor, updateCustomCSS, saveCustomCSS,
    updateSetting, handleLogoUpload, removeLogo,
    updateSidebarLabels, updateSectionHeaders,
} from './config.js';
import {
    renderStats, processMassLoad, renderEditList,
    openEdit, closeEditModal, saveExtraInfo, clearAllData,
} from './data.js';
import { wireReportStudioGlobals, initReportStudio, exportToPDF, loadDDSDataIntoReport } from './report-studio.js';
import { wireDataHubGlobals, setDataHubCallback, refreshDataHubStatus, openDataHub } from '../data-hub.js';
import { wireHelpGlobals, setHelpSection, toggleHelpModal } from '../help/guide.js';

export function updateUI() {
    try {
        renderStats();
        renderEditList();
        applyBrandSettings(getState());
        updateSidebarLabels();
        updateSectionHeaders();
        refreshDataHubStatus();
    } catch (error) {
        console.error('Error in updateUI:', error);
    }
}

export function switchAdminSection(sectionId) {
    ['config', 'data', 'report'].forEach((id) => {
        document.getElementById('section-' + id)?.classList.add('hidden');
        document.getElementById('nav-' + id)?.classList.remove('active');
    });
    document.getElementById('section-' + sectionId)?.classList.remove('hidden');
    document.getElementById('nav-' + sectionId)?.classList.add('active');
    if (sectionId === 'report') initReportStudio();
    setHelpSection('admin');
    updateUI();
}

function toggleHelpModalAdmin() {
    setHelpSection('admin');
    toggleHelpModal();
}

function init() {
    try {
        initAdminStore();
        wireReportStudioGlobals();
        wireDataHubGlobals();
        wireHelpGlobals();
        setDataHubCallback(updateUI);
        Object.assign(window, {
            toggleSidebar, switchAdminSection, clearAllData,
            openDataHub,
            addRole, deleteRole, updateBrandColor, updateCustomCSS, saveCustomCSS,
            updateSetting, handleLogoUpload, removeLogo,
            processMassLoad, openEdit, closeEditModal, saveExtraInfo,
            exportToPDF, loadDDSDataIntoReport,
            toggleHelpModal: toggleHelpModalAdmin,
        });
        applyBrand();
        const hash = (window.location.hash || '').replace('#', '');
        const initial = ['config', 'data', 'report'].includes(hash) ? hash : 'config';
        switchAdminSection(initial);
        refreshDataHubStatus();
    } catch (err) {
        console.error('Admin init error:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
