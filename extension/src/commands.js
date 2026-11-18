import { extractListing } from './extractors/listing.js';
import { extractThread } from './extractors/thread.js';
import { readPage } from './page-reader.js';
import { buildSearchUrl, buildThreadUrl, toOldReddit } from './urls.js';

const DEFAULT_MAX_ITEMS = 25;
const DEFAULT_MAX_COMMENTS = 200;

const handlers = {
  ping: async () => ({ version: chrome.runtime.getManifest().version }),
  search: (params) =>
    readPage(buildSearchUrl(params), extractListing, [params.max_items ?? DEFAULT_MAX_ITEMS]),
  listing: (params) =>
    readPage(toOldReddit(params.url), extractListing, [params.max_items ?? DEFAULT_MAX_ITEMS]),
  thread: (params) =>
    readPage(buildThreadUrl(params), extractThread, [params.max_comments ?? DEFAULT_MAX_COMMENTS]),
};

export async function runCommand({ type, params = {} }) {
  const handler = handlers[type];
  if (!handler) throw new Error(`Unknown command: ${type}`);
  return handler(params);
}
