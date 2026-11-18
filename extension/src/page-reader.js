import { findPageProblem } from './extractors/page-problem.js';
import { startCooldown, waitForTurn } from './pacing.js';
import { openInReaderTab, runInTab } from './reader-tab.js';

export async function readPage(url, extractor, args) {
  await waitForTurn();
  const tabId = await openInReaderTab(url.href);

  const problem = await runInTab(tabId, findPageProblem);
  if (problem) {
    if (problem.kind === 'blocked') await startCooldown();
    throw new Error(problem.message);
  }

  const data = await runInTab(tabId, extractor, args);
  if (!data) throw new Error(`Nothing readable found at ${url.href}`);
  return data;
}
