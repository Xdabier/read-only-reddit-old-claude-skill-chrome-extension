import { PACING } from './config.js';
import { sleep } from './keepalive.js';

const DEFAULT_STATE = { lastNavAt: 0, pagesSinceBreak: 0, blockedUntil: 0 };

const between = (min, max) => min + Math.random() * (max - min);

// Resolves when the next page load is allowed. State lives in storage so it
// survives service worker restarts.
export async function waitForTurn() {
  const state = await chrome.storage.local.get(DEFAULT_STATE);
  if (Date.now() < state.blockedUntil) {
    const until = new Date(state.blockedUntil).toLocaleTimeString();
    throw new Error(
      `Reddit blocked or rate limited an earlier request. Cooling down until ${until}. Do not retry before then.`,
    );
  }

  const needsBreak = state.pagesSinceBreak >= PACING.pagesPerBreak;
  const gap = needsBreak
    ? between(PACING.minBreakMs, PACING.maxBreakMs)
    : between(PACING.minGapMs, PACING.maxGapMs);
  const wait = state.lastNavAt + gap - Date.now();
  if (wait > 0) await sleep(wait);

  await chrome.storage.local.set({
    lastNavAt: Date.now(),
    pagesSinceBreak: needsBreak ? 1 : state.pagesSinceBreak + 1,
  });
}

export const startCooldown = () =>
  chrome.storage.local.set({ blockedUntil: Date.now() + PACING.blockCooldownMs });
