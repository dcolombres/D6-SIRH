import { loadState, saveState as writeState, migrateState, resetState } from './state.js';
import { applyBrandSettings } from './brand.js';

let _state;

export function getState() {
    return _state;
}

export function setState(s) {
    _state = s;
    persistState();
}

export function persistState() {
    writeState(_state);
    applyBrandSettings(_state);
}

export function initStore() {
    _state = migrateState(loadState());
    return _state;
}

export { resetState };
