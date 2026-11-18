import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildSearchUrl, buildThreadUrl, toOldReddit } from '../src/urls.js';

describe('toOldReddit', () => {
  it('moves any Reddit host to old.reddit.com and keeps the query', () => {
    for (const host of [
      'www.reddit.com',
      'reddit.com',
      'new.reddit.com',
      'np.reddit.com',
      'old.reddit.com',
    ]) {
      assert.equal(
        toOldReddit(`https://${host}/r/a/top/?t=month`).href,
        'https://old.reddit.com/r/a/top/?t=month',
      );
    }
  });

  it('accepts a bare path', () => {
    assert.equal(toOldReddit('/r/selfhosted').href, 'https://old.reddit.com/r/selfhosted');
  });

  it('expands redd.it short links', () => {
    assert.equal(
      toOldReddit('https://redd.it/abc123').href,
      'https://old.reddit.com/comments/abc123',
    );
  });

  it('rejects other sites, including lookalike hosts', () => {
    assert.throws(() => toOldReddit('https://example.com/r/a'), /Not a Reddit URL/);
    assert.throws(() => toOldReddit('https://notreddit.com/r/a'), /Not a Reddit URL/);
    assert.throws(() => toOldReddit('https://reddit.com.evil.example/r/a'), /Not a Reddit URL/);
  });

  it('rejects private and write pages', () => {
    for (const path of [
      '/message/inbox',
      '/prefs',
      '/submit',
      '/r/a/submit',
      '/r/a/about/modqueue',
      '/account',
    ]) {
      assert.throws(() => toOldReddit(path), /only reads public/, path);
    }
  });

  it('allows the front page listings and user pages', () => {
    for (const path of ['/', '/top/', '/user/someone', '/search?q=x', '/comments/abc/']) {
      assert.doesNotThrow(() => toOldReddit(path), path);
    }
  });

  it('never leaves old.reddit.com, whatever the input', () => {
    assert.equal(
      toOldReddit('https://user:pw@www.reddit.com:8443/r/a#frag').href,
      'https://old.reddit.com/r/a',
    );
  });
});

describe('buildSearchUrl', () => {
  it('builds a site wide search', () => {
    assert.equal(
      buildSearchUrl({ query: ' backup plan ' }).href,
      'https://old.reddit.com/search?q=backup+plan',
    );
  });

  it('builds a subreddit search with sort and time', () => {
    assert.equal(
      buildSearchUrl({ query: 'x', subreddit: '/r/selfhosted', sort: 'top', time: 'year' }).href,
      'https://old.reddit.com/r/selfhosted/search?q=x&restrict_sr=on&sort=top&t=year',
    );
  });

  it('rejects an empty query and a bad subreddit name', () => {
    assert.throws(() => buildSearchUrl({ query: '  ' }), /empty/);
    assert.throws(
      () => buildSearchUrl({ query: 'x', subreddit: 'a/../../prefs' }),
      /Not a valid subreddit/,
    );
  });
});

describe('buildThreadUrl', () => {
  it('adds sort and limit to a thread URL', () => {
    assert.equal(
      buildThreadUrl({
        url: 'https://www.reddit.com/r/a/comments/1/t/',
        sort: 'top',
        comment_limit: 500,
      }).href,
      'https://old.reddit.com/r/a/comments/1/t/?sort=top&limit=500',
    );
  });

  it('rejects a URL that is not a thread', () => {
    assert.throws(() => buildThreadUrl({ url: '/r/a' }), /Not a thread URL/);
  });
});
