import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CommandQueue } from '../src/bridge/command-queue.js';

describe('CommandQueue', () => {
  it('hands out commands in order and resolves them by id', async () => {
    const queue = new CommandQueue();
    const first = queue.enqueue('a', { n: 1 });
    const second = queue.enqueue('b', { n: 2 });

    const commandA = queue.take();
    const commandB = queue.take();
    assert.equal(commandA.type, 'a');
    assert.equal(commandB.type, 'b');
    assert.equal(queue.take(), null);

    queue.settle({ id: commandB.id, ok: true, data: 'B' });
    queue.settle({ id: commandA.id, ok: true, data: 'A' });
    assert.deepEqual(await Promise.all([first, second]), ['A', 'B']);
  });

  it('rejects when the extension reports an error', async () => {
    const queue = new CommandQueue();
    const pending = queue.enqueue('a', {});
    queue.settle({ id: queue.take().id, ok: false, error: 'nope' });
    await assert.rejects(pending, /nope/);
  });

  it('ignores a result for an unknown id', () => {
    const queue = new CommandQueue();
    assert.doesNotThrow(() => queue.settle({ id: 99, ok: true, data: null }));
  });

  it('tells the listener when a command is ready', async () => {
    const queue = new CommandQueue();
    let calls = 0;
    queue.onReady(() => {
      calls += 1;
    });
    const pending = queue.enqueue('a', {});
    assert.equal(calls, 1);
    queue.settle({ id: queue.take().id, ok: true, data: null });
    await pending;
  });

  it('rejects a command that nobody picks up', async () => {
    const queue = new CommandQueue({ pickupTimeoutMs: 20 });
    await assert.rejects(queue.enqueue('a', {}), /extension is not connected/);
  });

  it('rejects a command the extension never answers', async () => {
    const queue = new CommandQueue({ commandTimeoutMs: 20 });
    const pending = queue.enqueue('a', {});
    queue.take();
    await assert.rejects(pending, /took too long/);
  });
});
