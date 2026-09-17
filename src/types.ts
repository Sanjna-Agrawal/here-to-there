export type Urgency = 'urgent' | 'soon' | 'info';

export type CategoryId = 'before' | 'car' | 'government' | 'money' | 'business' | 'life' | 'accounts' | 'after';

/** Answers keyed by question key (see src/data/questions.json). Multi-select answers are arrays. */
export type Answers = Record<string, string | string[]>;

/** Show a task only when every listed answer includes one of the allowed values. */
export type Condition = Record<string, string[]>;

export interface Question {
  key: string;
  q: string;
  why: string;
  type: 'single' | 'multi';
  opts: [string, string][];
  askIf?: Condition;
}

export interface Task {
  id: string;
  title: string;
  detail: string;
  category: CategoryId;
  urgency: Urgency;
  /** Days relative to the move date. Negative = before the move. */
  dueDays?: number;
  /** Free-text timing when a day count doesn't fit ("Tax season"). */
  when?: string;
  link?: { label: string; url: string };
  showIf?: Condition;
}

export interface StateRules {
  state: string;
  code: string;
  /** Date the rules were last checked against official sources (YYYY-MM-DD). */
  lastReviewed: string;
  sources: string[];
  /** Tasks for people moving INTO this state. */
  arriving: Task[];
  /** Tasks for people moving OUT of this state. */
  leaving: Task[];
}

export interface MoveInfo {
  from: string;
  fromState: string;
  toMode: 'exact' | 'state';
  toAddress: string;
  toState: string;
  toCity: string;
  date: string;
}

export type AccountAction = '' | 'update' | 'stop' | 'skip';

export interface Account {
  id: string;
  name: string;
  domain?: string;
  category: string;
  link?: string;
  lastSeen?: string;
  emails?: number;
  mentionsAddress?: boolean;
  source: 'gmail' | 'manual';
  action: AccountAction;
}

export interface AppState {
  move: MoveInfo;
  answers: Answers;
  checked: Record<string, true>;
  hidden: Partial<Record<CategoryId, true>>;
  hideDone: boolean;
  accounts: Account[];
}
