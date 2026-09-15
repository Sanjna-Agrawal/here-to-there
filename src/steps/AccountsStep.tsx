import { useState } from 'react';
import { safeUrl, type StepProps } from './shared';
import { gmailConfigured, scanGmail } from '../gmail';
import type { Account, AccountAction } from '../types';

const CATS = ['Money', 'Shopping', 'Health', 'Work', 'Subscriptions', 'Government', 'Other'];

function age(lastSeen?: string): { text: string; old: boolean } {
  if (!lastSeen) return { text: '', old: false };
  const years = (Date.now() - new Date(lastSeen).getTime()) / (365 * 24 * 3600 * 1000);
  const text = `last email ${new Date(lastSeen).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  return { text, old: years > 2 };
}

export default function AccountsStep({ state, update, go }: StepProps) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Money');
  const [link, setLink] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'todo' | 'all'>('all');

  const add = () => {
    const n = name.trim();
    if (!n) return;
    const acct: Account = { id: `m-${Date.now().toString(36)}`, name: n.slice(0, 60), category: cat, link: safeUrl(link), source: 'manual', action: '' };
    update((s) => ({ ...s, accounts: [acct, ...s.accounts] }));
    setName('');
    setLink('');
  };

  const setAction = (id: string, action: AccountAction) =>
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, action: a.action === action ? '' : action } : a)) }));

  const remove = (id: string) =>
    update((s) => {
      const checked = { ...s.checked };
      delete checked[`acct-${id}`];
      return { ...s, checked, accounts: s.accounts.filter((a) => a.id !== id) };
    });

  const scan = async () => {
    setError('');
    setScanning(true);
    try {
      const found = await scanGmail(state.move.from, setProgress);
      update((s) => {
        const existing = new Map(s.accounts.map((a) => [a.id, a]));
        for (const f of found) {
          const prev = existing.get(f.id);
          existing.set(f.id, prev ? { ...f, action: prev.action } : f);
        }
        return { ...s, accounts: [...existing.values()] };
      });
      setProgress(`Found ${found.length} places.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The scan failed.');
      setProgress('');
    } finally {
      setScanning(false);
    }
  };

  const list = state.accounts.filter((a) => filter === 'all' || !a.action);
  const todo = state.accounts.filter((a) => !a.action).length;

  return (
    <main className="main mid">
      <div className="head">
        <h1>Places with your old address</h1>
        <p>Scan Gmail to find them, or add them yourself. Then choose what to do with each one.</p>
      </div>

      <div className="card stack">
        <div className="row">
          <div>
            <h3>Scan Gmail</h3>
            <p className="hint">Reads only who emailed you and when, never the emails themselves. Everything stays in this browser.</p>
          </div>
          {gmailConfigured ? (
            <button className="btn" onClick={scan} disabled={scanning}>{scanning ? 'Scanning…' : 'Connect Gmail'}</button>
          ) : (
            <a className="btn ghost" href="https://github.com/Sanjna-Agrawal/here-to-there/blob/main/docs/google-setup.md" target="_blank" rel="noopener">Set up Gmail scan</a>
          )}
        </div>
        {progress && <p className="hint" aria-live="polite">{progress}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div className="card">
        <form className="addrow" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <div className="field">
            <label className="label" htmlFor="a-name">Account</label>
            <input className="input" id="a-name" value={name} placeholder="e.g. Chase" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="a-cat">Type</label>
            <select className="input" id="a-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="a-link">Link (optional)</label>
            <input className="input" id="a-link" value={link} placeholder="chase.com" onChange={(e) => setLink(e.target.value)} />
          </div>
          <button className="btn" type="submit">Add</button>
        </form>
      </div>

      {state.accounts.length > 0 && (
        <div className="row">
          <div className="seg">
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All · {state.accounts.length}</button>
            <button aria-pressed={filter === 'todo'} onClick={() => setFilter('todo')}>To sort · {todo}</button>
          </div>
          <span className="hint">"Update" and "Stop mail" add the place to your checklist.</span>
        </div>
      )}

      <div className="list">
        {list.length === 0 && <div className="empty">{state.accounts.length ? 'Everything is sorted.' : 'Nothing here yet.'}</div>}
        {list.map((a) => {
          const seen = age(a.lastSeen);
          return (
            <div className="acc" key={a.id}>
              <div className="mono">{a.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="acc-name">
                  {a.name}
                  {a.mentionsAddress && <span className="pill good">Has your address</span>}
                  {seen.old && <span className="pill">Probably old</span>}
                </div>
                <div className="hint">
                  {[a.category, a.domain, seen.text].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="acc-actions">
                <div className="acts">
                  <button className="act upd" aria-pressed={a.action === 'update'} onClick={() => setAction(a.id, 'update')}>Update</button>
                  <button className="act stop" aria-pressed={a.action === 'stop'} onClick={() => setAction(a.id, 'stop')}>Stop mail</button>
                  <button className="act skip" aria-pressed={a.action === 'skip'} onClick={() => setAction(a.id, 'skip')}>Skip</button>
                </div>
                <button className="x" aria-label={`Remove ${a.name}`} onClick={() => remove(a.id)}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row">
        <button className="btn ghost" onClick={() => go('questions')}>Back</button>
        <button className="btn" onClick={() => go('checklist')}>See my checklist</button>
      </div>
    </main>
  );
}
