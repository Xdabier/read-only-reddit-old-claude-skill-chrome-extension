import { REDDIT_ORIGIN } from './config.js';

const REDDIT_HOST = /^(?:[a-z0-9-]+\.)?reddit\.com$/;
const SUBREDDIT = /^[A-Za-z0-9_]+(?:\+[A-Za-z0-9_]+)*$/;
// Public reading only. Keeps inbox, settings and mod pages out of reach.
const READABLE_PATH =
  /^\/(?:(?:hot|new|top|rising|controversial)\/?)?$|^\/(?:r|user|u|comments|search)(?:\/|$)/;
const PRIVATE_SEGMENT = /^\/r\/[^/]+\/(?:about|submit)(?:\/|$)/;

export function toOldReddit(input) {
  let url;
  try {
    url = new URL(String(input).trim(), REDDIT_ORIGIN);
  } catch {
    throw new Error(`Not a valid URL: ${input}`);
  }

  if (url.hostname === 'redd.it') {
    url = new URL(`/comments${url.pathname}`, REDDIT_ORIGIN);
  } else if (!REDDIT_HOST.test(url.hostname)) {
    throw new Error(`Not a Reddit URL: ${input}`);
  }
  if (!READABLE_PATH.test(url.pathname) || PRIVATE_SEGMENT.test(url.pathname)) {
    throw new Error(
      `This extension only reads public listings, searches and threads: ${url.pathname}`,
    );
  }
  return new URL(url.pathname + url.search, REDDIT_ORIGIN);
}

export function buildSearchUrl({ query, subreddit, sort, time }) {
  if (!query?.trim()) throw new Error('Search query is empty.');
  const sub = subreddit?.trim().replace(/^\/?r\//, '');
  if (sub && !SUBREDDIT.test(sub)) throw new Error(`Not a valid subreddit name: ${subreddit}`);

  const url = new URL(sub ? `/r/${sub}/search` : '/search', REDDIT_ORIGIN);
  url.searchParams.set('q', query.trim());
  if (sub) url.searchParams.set('restrict_sr', 'on');
  if (sort) url.searchParams.set('sort', sort);
  if (time) url.searchParams.set('t', time);
  return url;
}

export function buildThreadUrl({ url: input, sort, comment_limit: limit }) {
  const url = toOldReddit(input);
  if (!url.pathname.includes('/comments/')) throw new Error(`Not a thread URL: ${input}`);
  if (sort) url.searchParams.set('sort', sort);
  if (limit) url.searchParams.set('limit', String(limit));
  return url;
}
