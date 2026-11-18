import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { CommandQueue } from '../src/bridge/command-queue.js';
import { createBridge } from '../src/bridge/index.js';
import { freePort, startFakeExtension } from './helpers/fake-extension.js';

const answer = (command) =>
  command.type === 'fail'
    ? { ok: false, error: 'boom from extension' }
    : { ok: true, data: { echo: command.type, params: command.params } };

describe('bridge', () => {
  let port;
  let bridge;
  let extension;

  beforeEach(async () => {
    port = await freePort();
    bridge = createBridge({ port });
    await bridge.start();
    extension = startFakeExtension(port, answer);
  });

  afterEach(async () => {
    await extension.stop();
    await bridge.stop();
  });

  it('sends a command to the extension and returns its data', async () => {
    assert.deepEqual(await bridge.send('search', { query: 'x' }), {
      echo: 'search',
      params: { query: 'x' },
    });
  });

  it('turns an extension error into a rejection', async () => {
    await assert.rejects(bridge.send('fail'), /boom from extension/);
  });

  it('runs queued commands in order', async () => {
    const results = await Promise.all([bridge.send('a'), bridge.send('b'), bridge.send('c')]);
    assert.deepEqual(
      results.map((result) => result.echo),
      ['a', 'b', 'c'],
    );
  });

  it('lets a second bridge send through the port owner', async () => {
    const second = createBridge({ port });
    assert.equal(await second.start(), false);
    assert.equal((await second.send('ping')).echo, 'ping');
    await second.stop();
  });

  it('lets a second bridge take over when the owner stops', async () => {
    const second = createBridge({ port });
    await bridge.stop();
    assert.equal((await second.send('ping')).echo, 'ping');
    await second.stop();
  });
});

describe('bridge request guards', () => {
  let port;
  let bridge;

  beforeEach(async () => {
    port = await freePort();
    bridge = createBridge({ port });
    await bridge.start();
  });

  afterEach(() => bridge.stop());

  const status = async (path, init) =>
    (await fetch(`http://127.0.0.1:${port}${path}`, init)).status;

  it('rejects a request without the client header', async () => {
    assert.equal(await status('/poll', { method: 'POST' }), 403);
  });

  it('rejects a request from a web page origin', async () => {
    const headers = { 'X-Roro-Client': 'extension', Origin: 'https://evil.example' };
    assert.equal(await status('/poll', { method: 'POST', headers }), 403);
  });

  it('rejects methods other than POST', async () => {
    assert.equal(await status('/poll', { headers: { 'X-Roro-Client': 'extension' } }), 403);
  });

  it('rejects unknown paths', async () => {
    assert.equal(
      await status('/nope', { method: 'POST', headers: { 'X-Roro-Client': 'extension' } }),
      403,
    );
  });

  it('refuses a preflight from a web page origin', async () => {
    assert.equal(
      await status('/poll', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }),
      403,
    );
  });
});

describe('bridge without an extension', () => {
  it('rejects with a clear message when nothing polls', async () => {
    const port = await freePort();
    const bridge = createBridge({ port, queue: new CommandQueue({ pickupTimeoutMs: 50 }) });
    await assert.rejects(bridge.send('ping'), /extension is not connected/);
    await bridge.stop();
  });
});
