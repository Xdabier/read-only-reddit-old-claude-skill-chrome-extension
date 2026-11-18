import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatListing, formatThread } from '../src/format.js';

const item = {
  title: 'A post',
  url: 'https://old.reddit.com/r/a/comments/1/a_post/',
  subreddit: 'a',
  author: 'bob',
  score: 12,
  comments: 3,
  created: '2026-01-02T00:00:00Z',
  flair: 'Help',
  snippet: 'hello',
};

const post = {
  title: 'A post',
  url: item.url,
  link: null,
  subreddit: 'a',
  author: 'bob',
  score: 12,
  comment_count: 3,
  created: '2026-01-02T00:00:00Z',
  flair: null,
  text: 'Body',
};

const comment = (overrides) => ({
  depth: 0,
  author: 'amy',
  op: false,
  stickied: false,
  score: 5,
  created: '2026-01-03T00:00:00Z',
  text: 'hi',
  ...overrides,
});

describe('formatListing', () => {
  it('prints each post with its facts, URL and snippet', () => {
    const text = formatListing({
      page_title: 'results',
      url: 'https://x',
      items: [item],
      next_url: null,
    });
    assert.match(text, /^results\nhttps:\/\/x\n\n1\. A post\n/);
    assert.match(text, /r\/a · u\/bob · 12 points · 3 comments · 2026-01-02 · flair: Help/);
    assert.match(text, /\n {3}hello\n/);
    assert.match(text, /No more pages\.$/);
  });

  it('points to the next page when there is one', () => {
    const text = formatListing({
      page_title: 't',
      url: 'u',
      items: [item],
      next_url: 'https://next',
    });
    assert.match(text, /Next page \(use read_listing\): https:\/\/next$/);
  });

  it('says so when the page has no posts', () => {
    assert.equal(
      formatListing({ page_title: 't', url: 'https://x', items: [], next_url: null }),
      'No posts found at https://x',
    );
  });

  it('leaves out facts that are missing', () => {
    const bare = {
      ...item,
      score: null,
      comments: null,
      created: null,
      flair: null,
      snippet: null,
    };
    const text = formatListing({ page_title: 't', url: 'u', items: [bare], next_url: null });
    assert.match(text, /\n {3}r\/a · u\/bob\n/);
  });
});

describe('formatThread', () => {
  it('prints the post and indents replies by depth', () => {
    const text = formatThread({
      post,
      comments: [comment(), comment({ depth: 1, author: 'bob', op: true, text: 'line 1\nline 2' })],
      truncated: false,
    });
    assert.match(text, /^# A post\nr\/a · u\/bob · 12 points · 3 comments · 2026-01-02\n/);
    assert.match(text, /## Comments \(2 shown\)/);
    assert.match(text, /\[u\/amy · 5 points · 2026-01-03\]\nhi/);
    assert.match(text, /\n {2}\[u\/bob \(OP\) · 5 points · 2026-01-03\]\n {2}line 1\n {2}line 2/);
  });

  it('marks stubs and does not count them as comments', () => {
    const text = formatThread({
      post,
      comments: [
        comment(),
        { depth: 1, more: 'load more comments (3 replies)' },
        { depth: 1, continue_url: 'https://deep' },
      ],
      truncated: true,
    });
    assert.match(text, /## Comments \(1 shown, cut at the max_comments limit\)/);
    assert.match(text, /\n {2}\[not loaded: load more comments \(3 replies\)\]/);
    assert.match(text, /\n {2}\[thread continues, use read_thread: https:\/\/deep\]/);
  });

  it('shows the outbound link of a link post', () => {
    const text = formatThread({
      post: { ...post, link: 'https://example.com', text: '' },
      comments: [],
      truncated: false,
    });
    assert.match(text, /Links to: https:\/\/example\.com/);
    assert.match(text, /\(no comments\)$/);
  });

  it('prints deleted authors without the u/ prefix', () => {
    const text = formatThread({
      post: { ...post, author: '[deleted]' },
      comments: [comment({ author: '[deleted]', score: null, text: '' })],
      truncated: false,
    });
    assert.doesNotMatch(text, /u\/\[deleted\]/);
    assert.match(text, /\[\[deleted\] · 2026-01-03\]\n\(no text\)/);
  });
});
