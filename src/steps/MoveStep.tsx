import type { StepProps } from './shared';
import { US_STATES } from '../data/states';
import { destinationState, hasRules } from '../checklist';
import type { MoveInfo } from '../types';

export default function MoveStep({ state, update, go }: StepProps) {
  const m = state.move;
  const set = <K extends keyof MoveInfo>(key: K, value: MoveInfo[K]) =>
    update((s) => ({ ...s, move: { ...s.move, [key]: value } }));
  const dest = destinationState(state);

  return (
    <main className="main narrow">
      <div className="head">
        <h1>Where are you moving?</h1>
        <p>Your checklist is built from the state you're leaving and the state you're moving to.</p>
      </div>
      <div className="card form">
        <div className="field wide">
          <label className="label" htmlFor="from">Moving from</label>
          <div className="pair">
            <input className="input" id="from" value={m.from} placeholder="Current address" onChange={(e) => set('from', e.target.value)} />
            <select className="input" aria-label="Current state" value={m.fromState} onChange={(e) => set('fromState', e.target.value)}>
              <option value="">State</option>
              {US_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <span className="hint">Your old street and ZIP are used to search Gmail for places that have them. They never leave your browser.</span>
        </div>
        <div className="field wide">
          <div className="row">
            <span className="label">Moving to</span>
            <div className="seg">
              <button aria-pressed={m.toMode === 'exact'} onClick={() => set('toMode', 'exact')}>Exact address</button>
              <button aria-pressed={m.toMode === 'state'} onClick={() => set('toMode', 'state')}>Not sure yet</button>
            </div>
          </div>
          {m.toMode === 'exact' ? (
            <div className="pair">
              <input className="input" id="to" aria-label="New address" value={m.toAddress} placeholder="New address" onChange={(e) => set('toAddress', e.target.value)} />
              <select className="input" aria-label="New state" value={m.toState} onChange={(e) => set('toState', e.target.value)}>
                <option value="">State</option>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          ) : (
            <div className="pair">
              <select className="input" aria-label="New state" value={m.toState} onChange={(e) => set('toState', e.target.value)}>
                <option value="">Pick a state</option>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input className="input" aria-label="City or county" value={m.toCity} placeholder="City or county (optional)" onChange={(e) => set('toCity', e.target.value)} />
            </div>
          )}
        </div>
        <div className="field">
          <label className="label" htmlFor="date">Move date</label>
          <input className="input" type="date" id="date" value={m.date} onChange={(e) => set('date', e.target.value)} />
        </div>
      </div>
      {dest && !hasRules(dest) && (
        <div className="banner">
          We don't have {dest}-specific rules yet, so you'll get the general checklist.{' '}
          <a href="https://github.com/Sanjna-Agrawal/here-to-there/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Help add {dest}</a>.
        </div>
      )}
      <div className="row">
        <span />
        <button className="btn" onClick={() => go('questions')}>Next: questions</button>
      </div>
    </main>
  );
}
