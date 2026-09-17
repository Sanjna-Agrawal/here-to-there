/**
 * Gmail scan that runs entirely in the browser.
 *
 * - Uses Google Identity Services to get a short-lived access token (kept in memory only).
 * - Searches the inbox, then reads only the From and Date headers of matching messages.
 * - Email bodies are never downloaded, and nothing is sent anywhere except Google's API.
 */
import type { Account } from './types';

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_PER_QUERY = 400;

// Personal email providers: senders here are people, not companies.
const PERSONAL = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'me.com', 'proton.me', 'protonmail.com']);

const CATEGORY_HINTS: [RegExp, string][] = [
  [/bank|chase|amex|americanexpress|capitalone|citi|wellsfargo|discover|fidelity|vanguard|schwab|robinhood|paypal|venmo|credit|loan|mortgage|invest/i, 'Money'],
  [/amazon|target|walmart|macys|nordstrom|etsy|ebay|shop|store|order/i, 'Shopping'],
  [/health|pharm|cvs|walgreens|dental|clinic|medical|insurance|aetna|cigna|uhc|bluecross/i, 'Health'],
  [/netflix|spotify|hulu|subscription|magazine|nytimes|wsj/i, 'Subscriptions'],
  [/gov|irs|dmv|usps/i, 'Government'],
];

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(): void };
        };
      };
    };
  }
}

const CLIENT_KEY = 'here-to-there:google-client-id';

/** Client ID from .env.local, or one pasted into the app (saved in this browser only). */
export function getClientId(): string {
  const fromEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  if (fromEnv) return fromEnv;
  try {
    return localStorage.getItem(CLIENT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setClientId(id: string): boolean {
  const clean = id.trim();
  if (!/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clean)) return false;
  try {
    localStorage.setItem(CLIENT_KEY, clean);
  } catch {
    return false;
  }
  return true;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in.'));
    document.head.appendChild(s);
  });
}

async function getToken(): Promise<string> {
  await loadGoogleScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: SCOPE,
      callback: (resp) => (resp.access_token ? resolve(resp.access_token) : reject(new Error(resp.error ?? 'Gmail access was not granted.'))),
    });
    client.requestAccessToken();
  });
}

async function api<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Gmail returned ${res.status}. Try connecting again.`);
  return res.json() as Promise<T>;
}

async function searchIds(token: string, q: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = '';
  while (ids.length < MAX_PER_QUERY) {
    const params = new URLSearchParams({ q, maxResults: '100' });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await api<{ messages?: { id: string }[]; nextPageToken?: string }>(token, `/messages?${params}`);
    ids.push(...(page.messages ?? []).map((m) => m.id));
    if (!page.nextPageToken) break;
    pageToken = page.nextPageToken;
  }
  return ids.slice(0, MAX_PER_QUERY);
}

interface Header { name: string; value: string }

async function headersFor(token: string, id: string): Promise<{ from: string; date: string }> {
  const msg = await api<{ payload?: { headers?: Header[] } }>(
    token,
    `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,
  );
  const h = msg.payload?.headers ?? [];
  const get = (n: string) => h.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? '';
  return { from: get('From'), date: get('Date') };
}

function parseFrom(from: string): { name: string; domain: string } | null {
  const email = /<([^>]+)>/.exec(from)?.[1] ?? from.trim();
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain || PERSONAL.has(domain)) return null;
  const parts = domain.split('.');
  const twoPart = parts.length > 2 && parts[parts.length - 1].length === 2 && ['co', 'com', 'org', 'net', 'gov', 'ac'].includes(parts[parts.length - 2]);
  const base = parts.slice(twoPart ? -3 : -2).join('.');
  const name = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || base;
  return { name, domain: base };
}

/** Street line and ZIP from the old address, quoted for Gmail search. */
export function addressTerms(address: string): string[] {
  const terms: string[] = [];
  const zip = /\b\d{5}\b/.exec(address)?.[0];
  const street = address.split(',')[0]?.trim();
  if (street && /\d/.test(street) && street.length > 4) terms.push(`"${street}"`);
  if (zip) terms.push(`"${zip}"`);
  return terms;
}

export async function scanGmail(oldAddress: string, onProgress: (msg: string) => void): Promise<Account[]> {
  const token = await getToken();
  const terms = addressTerms(oldAddress);
  const queries: { q: string; mentionsAddress: boolean }[] = [];
  if (terms.length) queries.push({ q: `(${terms.join(' OR ')}) newer_than:5y`, mentionsAddress: true });
  queries.push({
    q: 'newer_than:3y (category:purchases OR subject:(statement OR receipt OR invoice OR "your order" OR "billing" OR "account"))',
    mentionsAddress: false,
  });

  const groups = new Map<string, Account & { names: Map<string, number> }>();
  for (const { q, mentionsAddress } of queries) {
    onProgress(mentionsAddress ? 'Looking for emails that mention your old address…' : 'Looking for receipts and statements…');
    const ids = await searchIds(token, q);
    for (let i = 0; i < ids.length; i += 8) {
      const batch = await Promise.all(ids.slice(i, i + 8).map((id) => headersFor(token, id)));
      onProgress(`Read ${Math.min(i + 8, ids.length)} of ${ids.length} senders…`);
      for (const { from, date } of batch) {
        const parsed = parseFrom(from);
        if (!parsed) continue;
        const parsedDate = date ? new Date(date) : null;
        const iso = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : '';
        const g = groups.get(parsed.domain) ?? {
          id: parsed.domain,
          name: parsed.name,
          domain: parsed.domain,
          category: CATEGORY_HINTS.find(([re]) => re.test(parsed.domain + ' ' + parsed.name))?.[1] ?? 'Other',
          link: `https://${parsed.domain}`,
          lastSeen: iso,
          emails: 0,
          mentionsAddress: false,
          source: 'gmail' as const,
          action: '' as const,
          names: new Map<string, number>(),
        };
        g.emails = (g.emails ?? 0) + 1;
        g.mentionsAddress = g.mentionsAddress || mentionsAddress;
        if (iso && (!g.lastSeen || iso > g.lastSeen)) g.lastSeen = iso;
        g.names.set(parsed.name, (g.names.get(parsed.name) ?? 0) + 1);
        groups.set(parsed.domain, g);
      }
    }
  }

  return [...groups.values()]
    .map(({ names, ...a }) => ({ ...a, name: [...names.entries()].sort((x, y) => y[1] - x[1])[0][0] }))
    .sort((a, b) => Number(b.mentionsAddress) - Number(a.mentionsAddress) || (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
}
