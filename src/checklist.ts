import general from './data/general.json';
import { STATE_RULES } from './data/states';
import type { Account, AppState, Answers, CategoryId, Task } from './types';

export const CATEGORIES: { id: CategoryId; name: string; sub: string }[] = [
  { id: 'before', name: 'Before you move', sub: 'The weeks before moving day' },
  { id: 'car', name: 'Car', sub: 'The order matters' },
  { id: 'government', name: 'Government', sub: 'License, voting, taxes, health' },
  { id: 'money', name: 'Money and everyday accounts', sub: 'Where your address is on file' },
  { id: 'business', name: 'Your business', sub: 'Company records follow you too' },
  { id: 'accounts', name: 'Your accounts', sub: 'From the Accounts tab' },
  { id: 'after', name: 'After you arrive', sub: 'The weeks after moving day' },
];

function matches(task: Task, answers: Answers): boolean {
  if (!task.showIf) return true;
  return (Object.keys(task.showIf) as (keyof Answers)[]).every((key) => {
    const allowed = task.showIf![key] as string[] | undefined;
    return !allowed || allowed.includes(answers[key]);
  });
}

function accountTask(a: Account): Task {
  return {
    id: `acct-${a.id}`,
    title: a.action === 'stop' ? `Stop paper mail from ${a.name}` : `Update your address with ${a.name}`,
    detail: a.category,
    category: 'accounts',
    urgency: 'info',
    when: a.action === 'stop' ? 'Stop mail' : 'Update',
    link: a.link ? { label: 'Open', url: a.link } : undefined,
  };
}

/** General tasks, overridden (by id) and extended by the destination and origin state files. */
export function buildTasks(state: AppState): Task[] {
  const byId = new Map<string, Task>();
  for (const t of general as Task[]) byId.set(t.id, t);
  const to = STATE_RULES[destinationState(state)];
  const from = STATE_RULES[state.move.fromState];
  for (const t of to?.arriving ?? []) byId.set(t.id, t);
  for (const t of from?.leaving ?? []) byId.set(t.id, t);
  const tasks = [...byId.values()].filter((t) => matches(t, state.answers));
  const accounts = state.accounts.filter((a) => a.action === 'update' || a.action === 'stop').map(accountTask);
  return [...tasks, ...accounts].sort((a, b) => (a.dueDays ?? 999) - (b.dueDays ?? 999));
}

export function destinationState(state: AppState): string {
  const { move } = state;
  if (move.toMode === 'state' || move.toState) return move.toState;
  const found = Object.keys(STATE_RULES).find((s) => {
    const code = STATE_RULES[s].code;
    return new RegExp(`\\b(${s}|${code})\\b`, 'i').test(move.toAddress);
  });
  return found ?? move.toState;
}

export function hasRules(stateName: string): boolean {
  return (STATE_RULES[stateName]?.arriving.length ?? 0) > 0;
}

export function dueLabel(task: Task, moveDate: string): string {
  if (task.when) return task.when;
  if (task.dueDays === undefined || !moveDate) return '';
  const d = new Date(`${moveDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + task.dueDays);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return task.dueDays < 0 ? `Before ${date}` : task.dueDays === 0 ? `Moving day` : `By ${date}`;
}
