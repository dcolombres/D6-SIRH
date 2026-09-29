import { initStore, getState, setState, persistState, resetState } from '../store.js';

export function initAdminStore() {
    return initStore();
}

export { getState, setState, resetState };

export function persistAdmin() {
    persistState();
}

export function resetAdminState() {
    setState(resetState());
}
