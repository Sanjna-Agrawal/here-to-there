// Validates the task data files. Run with: npm run check-data
import { readFileSync, readdirSync } from 'node:fs';

const CATEGORIES = ['before', 'car', 'government', 'money', 'business', 'life', 'after'];
const URGENCY = ['urgent', 'soon', 'info'];
const questions = JSON.parse(readFileSync('src/data/questions.json', 'utf8'));
const ANSWERS = Object.fromEntries(questions.map((q) => [q.key, q.opts.map((o) => o[0])]));
const errors = [];

function checkTask(t, where) {
  const at = `${where} → ${t.id ?? '(no id)'}`;
  if (!t.id || !/^[a-z0-9-]+$/.test(t.id)) errors.push(`${at}: id must be lowercase letters, numbers and hyphens`);
  if (!t.title) errors.push(`${at}: missing title`);
  if (typeof t.detail !== 'string') errors.push(`${at}: missing detail`);
  if (!CATEGORIES.includes(t.category)) errors.push(`${at}: category must be one of ${CATEGORIES.join(', ')}`);
  if (!URGENCY.includes(t.urgency)) errors.push(`${at}: urgency must be one of ${URGENCY.join(', ')}`);
  if (t.dueDays !== undefined && !Number.isInteger(t.dueDays)) errors.push(`${at}: dueDays must be a whole number`);
  if (t.link && !/^https:\/\//.test(t.link.url ?? '')) errors.push(`${at}: link.url must start with https://`);
  checkCondition(t.showIf, at, 'showIf');
}

function checkCondition(cond, at, label) {
  for (const [k, v] of Object.entries(cond ?? {})) {
    if (!ANSWERS[k]) errors.push(`${at}: unknown ${label} key "${k}"`);
    else for (const val of v) if (!ANSWERS[k].includes(val)) errors.push(`${at}: ${label}.${k} has unknown value "${val}"`);
  }
}
for (const q of questions) {
  if (!q.key || !q.q || !q.why || !['single', 'multi'].includes(q.type) || !q.opts?.length) errors.push(`questions.json → ${q.key}: needs key, q, why, type and opts`);
  checkCondition(q.askIf, `questions.json → ${q.key}`, 'askIf');
}

const general = JSON.parse(readFileSync('src/data/general.json', 'utf8'));
general.forEach((t) => checkTask(t, 'general.json'));

const dir = 'src/data/states';
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
  if (!s.state || !/^[A-Z]{2}$/.test(s.code ?? '')) errors.push(`${file}: needs "state" and a two-letter "code"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.lastReviewed ?? '')) errors.push(`${file}: lastReviewed must be YYYY-MM-DD`);
  if (!Array.isArray(s.sources) || s.sources.length === 0) errors.push(`${file}: list at least one official source`);
  for (const list of ['arriving', 'leaving']) {
    if (!Array.isArray(s[list])) errors.push(`${file}: "${list}" must be an array`);
    else s[list].forEach((t) => checkTask(t, `${file} ${list}`));
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Data looks good.');
