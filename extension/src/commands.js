import { readPage } from './page-reader.js';
import { buildSearchUrl, buildThreadUrl, toOldReddit } from './urls.js';

const DEFAULT_MAX_ITEMS = 25;
const DEFAULT_MAX_COMMENTS = 200;

const listing = (url, params) =>
  readPage({
    url,
    kind: 'listing',
    args: [params.max_items ?? DEFAULT_MAX_ITEMS],
    layout: params.layout,
  });

const handlers = {
  ping: async () => ({ version: chrome.runtime.getManifest().version }),
  search: (params) => listing(buildSearchUrl(params), params),
  listing: (params) => listing(toOldReddit(params.url), params),
  thread: (params) =>
    readPage({
      url: buildThreadUrl(params),
      kind: 'thread',
      args: [params.max_comments ?? DEFAULT_MAX_COMMENTS],
      layout: params.layout,
    }),
};

export async function runCommand({ type, params = {} }) {
  const handler = handlers[type];
  if (!handler) throw new Error(`Unknown command: ${type}`);
  return handler(params);
}
