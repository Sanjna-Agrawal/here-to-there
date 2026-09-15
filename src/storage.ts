import type { AppState } from './types';

const KEY = 'here-to-there:v1';

export const DEFAULT_STATE: AppState = {
  move: { from: '', fromState: '', toMode: 'exact', toAddress: '', toState: '', toCity: '', date: '' },
  answers: { car: 'no', business: 'no', payroll: 'notsure', health: 'employer', housing: 'rent' },
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
