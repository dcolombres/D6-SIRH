import { persistState } from '../store.js';
import { renderOverview } from './overview.js';

export function updateUI() {
  try {
    renderOverview();
  } catch (e) {
    console.error('UI Update Error:', e);
  } finally {
    persistState();
  }
}
