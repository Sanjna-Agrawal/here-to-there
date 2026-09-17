import type { AppState } from './types';

const KEY = 'here-to-there:v1';

export const DEFAULT_STATE: AppState = {
  move: { from: '', fromState: '', toMode: 'exact', toAddress: '', toState: '', toCity: '', date: '' },
  answers: {},
  checked: {},
  hidden: {},
  hideDone: false,
  accounts: [],
};

/** Everything stays in this browser. Nothing is sent to a server. */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw) as Partial<AppState>;
    if (saved.answers) saved.answers = migrateAnswers(saved.answers);
    return {
      ...DEFAULT_STATE,
      ...saved,
      move: { ...DEFAULT_STATE.move, ...saved.move },
      answers: { ...DEFAULT_STATE.answers, ...saved.answers },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode). The app still works for this session.
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/** Maps answers saved by version 0.1 onto the current question keys. */
function migrateAnswers(a: Record<string, string | string[]>): Record<string, string | string[]> {
  const out = { ...a };
  if (typeof a.housing === 'string' && !out.newHousing) out.newHousing = a.housing === 'own' ? 'buy' : a.housing;
  if (typeof a.car === 'string' && !out.vehicles) out.vehicles = a.car === 'yes' ? ['car'] : a.car === 'plan' ? ['plan'] : ['none'];
  if (!out.work && (a.business === 'yes' || a.payroll === 'yes')) {
    out.work = [...(a.payroll === 'yes' ? ['employee'] : []), ...(a.business === 'yes' ? ['business'] : [])];
  }
  if (a.health === 'other') out.health = 'other';
  delete out.housing;
  delete out.car;
  delete out.business;
  delete out.payroll;
  return out;
}
