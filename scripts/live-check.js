#!/usr/bin/env node
// Manual check against real Reddit, through the loaded extension. Not part of
// `npm test` or CI. It loads two pages, at the extension's normal slow pace.
//
//   npm run test:live          reads new Reddit only
//   npm run test:live -- old   reads old Reddit only
//   npm run test:live -- auto  old Reddit first, new Reddit on a login wall
import assert from 'node:assert/strict';

import { createBridge } from '../mcp-server/src/bridge/index.js';
import { createTools } from '../mcp-server/src/tools.js';

const REQUESTED_NOTE = /^Note: read from www\.reddit\.com, as requested/;
const SEARCH = {
  query: 'backup',
  subreddit: 'selfhosted',
  sort: 'top',
  time: 'year',
  max_items: 5,
};

const layout = process.argv[2] ?? 'new';
const bridge = createBridge();
const tools = Object.fromEntries(createTools(bridge).map((tool) => [tool.name, tool.handler]));

const head = (text, lines) => text.split('\n').slice(0, lines).join('\n');

function checkLayoutNote(text) {
  if (layout === 'new') assert.match(text, REQUESTED_NOTE, 'new Reddit output must say so');
  if (layout === 'old') assert.doesNotMatch(text, /^Note:/, 'old Reddit output has no note');
}

try {
  console.log(await tools.status({}));

  console.log(`\nsearch (layout: ${layout}), this can take a while...`);
  const listing = await tools.search({ ...SEARCH, layout });
  checkLayoutNote(listing);
  const results = listing.match(/^\d+\. /gm) ?? [];
  assert.ok(results.length > 0, 'search returned no posts');
  console.log(head(listing, 8));
  console.log(`-> ${results.length} posts`);

  const [threadUrl] = /https:\/\/\S+\/comments\/\S+/.exec(listing) ?? [];
  assert.ok(threadUrl, 'search output has no thread URL');

  console.log(`\nread_thread (layout: ${layout}), this can take a while...`);
  const thread = await tools.read_thread({ url: threadUrl, max_comments: 20, layout });
  checkLayoutNote(thread);
  const [, shown] = /## Comments \((\d+) shown/.exec(thread) ?? [];
  assert.ok(Number(shown) > 0, 'thread returned no comments');
  console.log(head(thread, 6));
  console.log(`-> ${shown} comments`);

  console.log('\nlive check passed');
} catch (error) {
  console.error(`\nlive check failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await bridge.stop();
}
