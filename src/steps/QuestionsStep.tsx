import { useState } from 'react';
import type { StepProps } from './shared';
import type { Answers, Condition, Question } from '../types';
import questionData from '../data/questions.json';
import { TickIcon } from '../icons';

const QUESTIONS = questionData as Question[];

/** A follow-up question is only asked when its trigger answer was actually given. */
function shouldAsk(q: Question, answers: Answers): boolean {
  if (!q.askIf) return true;
  return Object.entries(q.askIf as Condition).every(([key, allowed]) => {
    const a = answers[key];
    const given = Array.isArray(a) ? a : a ? [a] : [];
    return given.some((v) => allowed.includes(v));
  });
}

// Options that mean "none of the above" clear the other picks in a multi-select.
const EXCLUSIVE = new Set(['none', 'solo']);

export default function QuestionsStep({ state, update, go }: StepProps) {
  const visible = QUESTIONS.filter((q) => shouldAsk(q, state.answers));
  const firstOpen = visible.findIndex((q) => state.answers[q.key] === undefined);
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const i = Math.min(index, visible.length - 1);
  const q = visible[i];
  const answer = state.answers[q.key];
  const picked = Array.isArray(answer) ? answer : answer ? [answer] : [];
  const answeredCount = visible.filter((v) => state.answers[v.key] !== undefined).length;

  const next = () => {
    if (i < visible.length - 1) setIndex(i + 1);
    else go('accounts');
  };
  const back = () => (i > 0 ? setIndex(i - 1) : go('move'));

  const choose = (value: string) => {
    if (q.type === 'single') {
      update((s) => ({ ...s, answers: { ...s.answers, [q.key]: value } }));
      // Short pause so the selection is visible before moving on.
      window.setTimeout(next, 220);
      return;
    }
    let values: string[];
    if (EXCLUSIVE.has(value)) values = picked.includes(value) ? [] : [value];
    else values = picked.includes(value) ? picked.filter((v) => v !== value) : [...picked.filter((v) => !EXCLUSIVE.has(v)), value];
    update((s) => {
      const answers = { ...s.answers };
      if (values.length) answers[q.key] = values;
      else delete answers[q.key];
      return { ...s, answers };
    });
  };

  const skip = () => {
    update((s) => {
      const answers = { ...s.answers };
      delete answers[q.key];
      return { ...s, answers };
    });
    next();
  };

  return (
    <main className="main wizard">
      <div className="wiz-top">
        <button className="linkbtn" onClick={back}>← Back</button>
        <span className="hint">Question {i + 1} of {visible.length}</span>
        <button className="linkbtn" onClick={() => go('accounts')}>Skip the rest</button>
      </div>
      <div className="bar" aria-hidden="true"><i style={{ width: `${Math.round((answeredCount / visible.length) * 100)}%` }} /></div>

      <div className="card stack wiz-card" key={q.key}>
        <div className="stack" style={{ gap: 6 }}>
          <h1>{q.q}</h1>
          <p className="hint wiz-why">{q.why}</p>
        </div>
        {q.type === 'multi' && <p className="label">Pick all that apply</p>}
        <div className="opts" role={q.type === 'single' ? 'radiogroup' : 'group'} aria-label={q.q}>
          {q.opts.map(([value, label]) => (
            <button
              key={value}
              className="opt"
              role={q.type === 'single' ? 'radio' : 'checkbox'}
              aria-checked={picked.includes(value)}
              aria-pressed={picked.includes(value)}
              onClick={() => choose(value)}
            >
              {label}
              <span className="tick"><TickIcon size={14} /></span>
            </button>
          ))}
        </div>
        <div className="row">
          <button className="linkbtn" onClick={skip}>Not sure, skip</button>
          {(q.type === 'multi' || picked.length > 0) && (
            <button className="btn" onClick={next} disabled={q.type === 'multi' && picked.length === 0}>
              {i === visible.length - 1 ? 'Done' : 'Next'}
            </button>
          )}
        </div>
      </div>
      <p className="hint">Skipped questions keep the related tasks on your checklist, so nothing gets missed.</p>
    </main>
  );
}
