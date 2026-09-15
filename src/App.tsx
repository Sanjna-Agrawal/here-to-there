import { useEffect, useState } from 'react';
import { loadState, saveState } from './storage';
import type { AppState } from './types';
import MoveStep from './steps/MoveStep';
import QuestionsStep from './steps/QuestionsStep';
import AccountsStep from './steps/AccountsStep';
import ChecklistStep from './steps/ChecklistStep';
import { HomeIcon } from './icons';

export type View = 'move' | 'questions' | 'accounts' | 'checklist';

const TABS: [View, string][] = [
  ['move', 'Your move'],
  ['questions', 'Questions'],
  ['accounts', 'Accounts'],
  ['checklist', 'Checklist'],
];

export type Update = (fn: (s: AppState) => AppState) => void;

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<View>(() => (loadState().move.date ? 'checklist' : 'move'));

  useEffect(() => saveState(state), [state]);

  const update: Update = (fn) => setState((s) => fn(s));
  const go = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <div className="logo"><HomeIcon /></div>
          Here to There
        </div>
        <nav className="steps" aria-label="Steps">
          {TABS.map(([id, label], i) => (
            <button key={id} className="step" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
              <span className="n">{i + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        <span className="save">Saved in this browser</span>
      </header>
      {view === 'move' && <MoveStep state={state} update={update} go={go} />}
      {view === 'questions' && <QuestionsStep state={state} update={update} go={go} />}
      {view === 'accounts' && <AccountsStep state={state} update={update} go={go} />}
      {view === 'checklist' && <ChecklistStep state={state} update={update} go={go} />}
      <footer className="foot">
        Open source ·{' '}
        <a href="https://github.com/Sanjna-Agrawal/here-to-there" target="_blank" rel="noopener">
          View on GitHub
        </a>{' '}
        · Not legal or tax advice. Check deadlines with your state.
      </footer>
    </div>
  );
}
