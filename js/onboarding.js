import { getProfile, setProfile, isOnboardingDone, setOnboardingDone } from './state.js';
import { getState, setState } from './store.js';

export function maybeShowOnboarding() {
  if (isOnboardingDone()) return;
  document.getElementById('onboarding-modal')?.classList.remove('hidden');
  const input = document.getElementById('onboarding-name');
  if (input) input.value = getProfile().name || getState()?.settings?.operatorName || '';
}

export function completeOnboarding() {
  const name = document.getElementById('onboarding-name')?.value?.trim() || '';
  if (name) {
    setProfile({ ...getProfile(), name });
    const state = getState();
    if (state?.settings) {
      state.settings.operatorName = name;
      setState(state);
    }
  }
  setOnboardingDone();
  document.getElementById('onboarding-modal')?.classList.add('hidden');
}

export function skipOnboarding() {
  setOnboardingDone();
  document.getElementById('onboarding-modal')?.classList.add('hidden');
}

export function wireOnboardingGlobals() {
  Object.assign(window, { completeOnboarding, skipOnboarding });
}
