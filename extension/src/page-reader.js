import { findPageProblem } from './extractors/page-problem.js';
import { readWithFallback } from './fallback.js';
import { LAYOUTS } from './layouts.js';
import { assertServed, LoginRequired, oldRedditWall } from './login-wall.js';
import { startCooldown, waitForTurn } from './pacing.js';
import { openInReaderTab, runInTab } from './reader-tab.js';

async function readFrom(layout, { url, kind, args }) {
  await waitForTurn();
  const target = new URL(url.pathname + url.search, layout.origin);
  const { tabId, landedUrl } = await openInReaderTab(target.href);
  assertServed(target, landedUrl);

  const problem = await runInTab(tabId, findPageProblem);
  if (problem?.kind === 'login') throw new LoginRequired();
  if (problem) {
    if (problem.kind === 'blocked') await startCooldown();
    throw new Error(problem.message);
  }

  const data = await runInTab(tabId, layout.extractors[kind], args);
  if (!data) throw new Error(`Nothing readable found at ${target.href}`);
  return { ...data, layout: layout.name };
}

// `request` is { url, kind, args }: a Reddit URL, 'listing' or 'thread', and
// the extractor arguments.
export function readPage(request) {
  return readWithFallback({
    readOld: () => readFrom(LAYOUTS.old, request),
    readNew: () => readFrom(LAYOUTS.new, request),
    wall: oldRedditWall,
  });
}
