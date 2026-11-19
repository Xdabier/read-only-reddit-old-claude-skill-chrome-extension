import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readWithFallback } from '../src/fallback.js';
import { assertServed, LoginRequired } from '../src/login-wall.js';

function setup({ old, fresh, wallUp = false, layout }) {
  const calls = [];
  const wall = {
    remembered: false,
    isUp: async () => wallUp,
    remember: async () => {
      wall.remembered = true;
    },
  };
  const step = (name, outcome) => async () => {
    calls.push(name);
    if (outcome instanceof Error) throw outcome;
    return outcome;
  };
  return { calls, wall, layout, readOld: step('old', old), readNew: step('new', fresh) };
}

describe('readWithFallback', () => {
  it('reads old Reddit and never touches new Reddit when it works', async () => {
    const s = setup({ old: { layout: 'old' }, fresh: { layout: 'new' } });
    assert.deepEqual(await readWithFallback(s), { layout: 'old' });
    assert.deepEqual(s.calls, ['old']);
    assert.equal(s.wall.remembered, false);
  });

  it('falls back to new Reddit on a login wall and remembers it', async () => {
    const s = setup({ old: new LoginRequired(), fresh: { layout: 'new' } });
    assert.deepEqual(await readWithFallback(s), { layout: 'new', fell_back: true });
    assert.deepEqual(s.calls, ['old', 'new']);
    assert.equal(s.wall.remembered, true);
  });

  it('skips old Reddit while the wall is remembered', async () => {
    const s = setup({ old: { layout: 'old' }, fresh: { layout: 'new' }, wallUp: true });
    assert.deepEqual(await readWithFallback(s), { layout: 'new', fell_back: true });
    assert.deepEqual(s.calls, ['new']);
  });

  it('does not fall back on a block or any other error', async () => {
    const s = setup({ old: new Error('Reddit blocked this request'), fresh: { layout: 'new' } });
    await assert.rejects(readWithFallback(s), /blocked/);
    assert.deepEqual(s.calls, ['old']);
    assert.equal(s.wall.remembered, false);
  });

  it('asks for a login when both layouts want one', async () => {
    const s = setup({ old: new LoginRequired(), fresh: new LoginRequired() });
    await assert.rejects(readWithFallback(s), /Ask the user to log in/);
  });

  it('passes on an error from new Reddit', async () => {
    const s = setup({ old: new LoginRequired(), fresh: new Error('Page load timed out.') });
    await assert.rejects(readWithFallback(s), /timed out/);
  });
});

describe('readWithFallback with a forced layout', () => {
  it('reads only new Reddit when asked, even if old Reddit works', async () => {
    const s = setup({ old: { layout: 'old' }, fresh: { layout: 'new' }, layout: 'new' });
    assert.deepEqual(await readWithFallback(s), { layout: 'new' });
    assert.deepEqual(s.calls, ['new']);
    assert.equal(s.wall.remembered, false);
  });

  it('reads only old Reddit when asked, even while the wall is remembered', async () => {
    const s = setup({ old: { layout: 'old' }, fresh: {}, wallUp: true, layout: 'old' });
    assert.deepEqual(await readWithFallback(s), { layout: 'old' });
    assert.deepEqual(s.calls, ['old']);
  });

  it('does not fall back from a forced old layout on a login wall', async () => {
    const s = setup({ old: new LoginRequired(), fresh: { layout: 'new' }, layout: 'old' });
    await assert.rejects(readWithFallback(s), /login on old\.reddit\.com/);
    assert.deepEqual(s.calls, ['old']);
    assert.equal(s.wall.remembered, false);
  });

  it('asks for a login when the forced new layout wants one', async () => {
    const s = setup({ old: { layout: 'old' }, fresh: new LoginRequired(), layout: 'new' });
    await assert.rejects(readWithFallback(s), /login on www\.reddit\.com/);
  });

  it('rejects an unknown layout', async () => {
    const s = setup({ old: {}, fresh: {}, layout: 'mobile' });
    await assert.rejects(readWithFallback(s), /Unknown layout: mobile/);
    assert.deepEqual(s.calls, []);
  });
});

describe('assertServed', () => {
  const target = new URL('https://old.reddit.com/r/a/comments/1/t/');

  it('accepts the page it asked for', () => {
    assert.doesNotThrow(() => assertServed(target, 'https://old.reddit.com/r/a/comments/1/t/'));
  });

  it('treats a login path as a login wall', () => {
    assert.throws(() => assertServed(target, 'https://old.reddit.com/login?dest=x'), LoginRequired);
    assert.throws(
      () =>
        assertServed(new URL('https://www.reddit.com/r/a'), 'https://www.reddit.com/login/?dest=x'),
      LoginRequired,
    );
  });

  it('treats a move to the other Reddit origin as a login wall', () => {
    assert.throws(
      () => assertServed(target, 'https://www.reddit.com/r/a/comments/1/t/'),
      LoginRequired,
    );
  });

  it('reports a plain error when the page left Reddit', () => {
    assert.throws(() => assertServed(target, undefined), /redirected away from Reddit/);
  });

  it('does not mistake a thread about logins for a login page', () => {
    assert.doesNotThrow(() =>
      assertServed(target, 'https://old.reddit.com/r/a/comments/1/login_problems/'),
    );
  });
});
