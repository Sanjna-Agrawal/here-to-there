import { useMemo } from 'react';
import type { StepProps } from './shared';
import { CATEGORIES, buildTasks, destinationState, dueLabel, hasRules } from '../checklist';
import type { CategoryId } from '../types';
import { OutIcon, TickIcon } from '../icons';

export default function ChecklistStep({ state, update, go }: StepProps) {
  const tasks = useMemo(() => buildTasks(state), [state]);
  const dest = destinationState(state);
  const m = state.move;
  const toLabel = m.toMode === 'exact' ? m.toAddress || dest : [m.toCity, m.toState].filter(Boolean).join(', ');

  const groups = CATEGORIES.map((c) => ({ ...c, items: tasks.filter((t) => t.category === c.id) })).filter(
    (g) => g.items.length > 0 || g.id === 'accounts',
  );
  const done = tasks.filter((t) => state.checked[t.id]).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const keyDates = tasks
    .filter((t) => t.urgency === 'urgent' && t.dueDays !== undefined && t.dueDays > 0 && !state.checked[t.id])
    .slice(0, 4);

  const toggle = (id: string) =>
    update((s) => {
      const checked = { ...s.checked };
      if (checked[id]) delete checked[id];
      else checked[id] = true;
      return { ...s, checked };
    });
  const toggleCat = (id: CategoryId) =>
    update((s) => {
      const hidden = { ...s.hidden };
      if (hidden[id]) delete hidden[id];
      else hidden[id] = true;
      return { ...s, hidden };
    });

  return (
    <div className="layout">
      <aside className="side">
        <div className="card stack">
          <div className="progress-top">
            <span>{done} of {tasks.length} done</span>
            <span className="faint">{pct}%</span>
          </div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        </div>

        {keyDates.length > 0 && (
          <div className="card stack">
            <div className="label">Coming up</div>
            <div className="dates">
              {keyDates.map((t) => (
                <div className="date" key={t.id}>
                  <b>{dueLabel(t, m.date).replace(/^By /, '')}</b>
                  <span>{t.title.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card stack">
          <div className="row">
            <div className="label">Show</div>
            <button className="linkbtn" onClick={() => update((s) => ({ ...s, hidden: {} }))}>Show all</button>
          </div>
          <div className="filters">
            {groups.map((g) => {
              const on = !state.hidden[g.id];
              const c = g.items.filter((t) => state.checked[t.id]).length;
              return (
                <button key={g.id} className="filter" aria-pressed={on} onClick={() => toggleCat(g.id)}>
                  <span className="l"><span className="dot">{on && <TickIcon size={12} />}</span>{g.name}</span>
                  <small>{c}/{g.items.length}</small>
                </button>
              );
            })}
          </div>
          <div className="divider">
            <button className="filter" aria-pressed={state.hideDone} onClick={() => update((s) => ({ ...s, hideDone: !s.hideDone }))}>
              <span className="l"><span className="dot">{state.hideDone && <TickIcon size={12} />}</span>Hide finished items</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="head">
          <h1>Your move checklist</h1>
          <p>{m.from || 'Your old place'} → {toLabel || 'your new place'}</p>
        </div>
        {!m.date && (
          <div className="banner">
            Add your move date to see due dates. <button className="linkbtn" onClick={() => go('move')}>Add it</button>
          </div>
        )}
        {dest && !hasRules(dest) && (
          <div className="banner">This is the general checklist. {dest}-specific rules haven't been added yet.</div>
        )}
        {groups.filter((g) => !state.hidden[g.id]).map((g) => {
          const c = g.items.filter((t) => state.checked[t.id]).length;
          const rows = g.items.filter((t) => !(state.hideDone && state.checked[t.id]));
          return (
            <section className="sec" key={g.id}>
              <div className="sechead">
                <div>
                  <h2>{g.name}</h2>
                  <p>{g.sub}</p>
                </div>
                <span className={`count${c === g.items.length && c ? ' full' : ''}`}>{c} of {g.items.length}</span>
              </div>
              <div className="list">
                {rows.length === 0 && (
                  <div className="empty">
                    {g.id === 'accounts' && g.items.length === 0 ? (
                      <>No accounts yet. <button className="linkbtn" onClick={() => go('accounts')}>Add some</button></>
                    ) : 'All done here.'}
                  </div>
                )}
                {rows.map((t) => {
                  const on = Boolean(state.checked[t.id]);
                  const due = dueLabel(t, m.date);
                  return (
                    <div className={`item${on ? ' done' : ''}`} key={t.id}>
                      <input className="check" type="checkbox" id={`cb-${t.id}`} checked={on} onChange={() => toggle(t.id)} />
                      <div>
                        <label htmlFor={`cb-${t.id}`}>{t.title}</label>
                        {t.detail && <p className="desc">{t.detail}</p>}
                        {due && <span className={`tag ${t.urgency}`}>{due}</span>}
                      </div>
                      {t.link ? (
                        <a className="go" href={t.link.url} target="_blank" rel="noopener">{t.link.label}<OutIcon /></a>
                      ) : <span />}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
