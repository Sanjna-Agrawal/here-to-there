import type { AppState } from '../types';
import type { Update, View } from '../App';

export interface StepProps {
  state: AppState;
  update: Update;
  go: (v: View) => void;
}

export const REPO_URL = 'https://github.com/Sanjna-Agrawal/here-to-there';

export function safeUrl(input: string): string | undefined {
  let u = input.trim();
  if (!u) return undefined;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
