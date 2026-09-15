import type { StepProps } from './shared';
import type { Answers } from '../types';
import { TickIcon } from '../icons';

type Q = { key: keyof Answers; q: string; why: string; opts: [string, string][] };

const QUESTIONS: Q[] = [
  { key: 'housing', q: 'Are you renting or buying the new place?', why: 'Decides insurance and deposit tasks.', opts: [['rent', 'Renting'], ['own', 'Buying or own']] },
  { key: 'car', q: 'Do you have a car?', why: 'Decides whether you need to register it in the new state.', opts: [['yes', 'Yes, I own or lease one'], ['plan', 'Not yet, but I plan to'], ['no', 'No car']] },
  { key: 'payroll', q: 'Is state tax withheld from your pay?', why: 'If so, it needs to switch to your new state.', opts: [['yes', "Yes, I'm on payroll"], ['no', 'No'], ['notsure', 'Not sure']] },
  { key: 'health', q: 'Where is your health insurance from?', why: 'Marketplace plans usually need a new plan in the new state.', opts: [['employer', 'An employer'], ['marketplace', 'The Marketplace'], ['other', 'Something else']] },
  { key: 'business', q: 'Do you run a business?', why: 'Company records have their own address to update.', opts: [['yes', 'Yes'], ['no', 'No']] },
];

export default function QuestionsStep({ state, update, go }: StepProps) {
  return (
    <main className="main mid">
      <div className="head">
        <h1>A few quick questions</h1>
        <p>Your answers decide which tasks show up on your checklist.</p>
      </div>
      <div className="qgrid">
        {QUESTIONS.map((q) => (
          <div className="card stack" key={q.key}>
            <div>
              <h3>{q.q}</h3>
              <p className="hint">{q.why}</p>
            </div>
            <div className="opts">
              {q.opts.map(([value, label]) => (
                <button
                  key={value}
                  className="opt"
                  aria-pressed={state.answers[q.key] === value}
                  onClick={() => update((s) => ({ ...s, answers: { ...s.answers, [q.key]: value } }))}
                >
                  {label}
                  <span className="tick"><TickIcon size={14} /></span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="row">
        <button className="btn ghost" onClick={() => go('move')}>Back</button>
        <button className="btn" onClick={() => go('accounts')}>Next: accounts</button>
      </div>
    </main>
  );
}
