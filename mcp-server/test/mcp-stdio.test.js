import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDispatcher } from '../src/mcp-stdio.js';
import { createTools } from '../src/tools.js';

const info = { name: 'test', version: '0.0.0' };
const tools = [
  {
    name: 'ok',
    description: 'works',
    inputSchema: { type: 'object' },
    handler: async ({ word }) => `said ${word}`,
  },
  {
    name: 'broken',
    description: 'fails',
    inputSchema: { type: 'object' },
    handler: async () => {
      throw new Error('it broke');
    },
  },
];
const dispatch = createDispatcher({ info, tools });

describe('MCP dispatcher', () => {
  it('answers initialize with the client protocol version', () => {
    assert.deepEqual(
      dispatch({ method: 'initialize', params: { protocolVersion: '2025-03-26' } }),
      {
        protocolVersion: '2025-03-26',
        capabilities: { tools: {} },
        serverInfo: info,
      },
    );
  });

  it('lists tools without their handlers', () => {
    const { tools: listed } = dispatch({ method: 'tools/list' });
    assert.deepEqual(
      listed.map((tool) => Object.keys(tool)),
      [
        ['name', 'description', 'inputSchema'],
        ['name', 'description', 'inputSchema'],
      ],
    );
  });

  it('returns tool output as text', async () => {
    const result = await dispatch({
      method: 'tools/call',
      params: { name: 'ok', arguments: { word: 'hi' } },
    });
    assert.deepEqual(result, { content: [{ type: 'text', text: 'said hi' }], isError: false });
  });

  it('reports a failing tool as an error result, not a protocol error', async () => {
    const result = await dispatch({ method: 'tools/call', params: { name: 'broken' } });
    assert.deepEqual(result, { content: [{ type: 'text', text: 'it broke' }], isError: true });
  });

  it('reports an unknown tool', async () => {
    const result = await dispatch({ method: 'tools/call', params: { name: 'nope' } });
    assert.equal(result.isError, true);
  });

  it('throws method not found for an unknown method', () => {
    assert.throws(() => dispatch({ method: 'nope' }), { code: -32601 });
  });
});

describe('tools', () => {
  const sent = [];
  const bridge = {
    send: async (type, params) => {
      sent.push({ type, params });
      return type === 'ping'
        ? { version: '9.9.9' }
        : { page_title: 't', url: 'https://x', items: [], next_url: null };
    },
  };
  const byName = Object.fromEntries(createTools(bridge).map((tool) => [tool.name, tool]));

  it('exposes the four read-only tools', () => {
    assert.deepEqual(Object.keys(byName), ['status', 'search', 'read_thread', 'read_listing']);
  });

  it('maps each tool to its extension command', async () => {
    assert.equal(await byName.status.handler({}), 'Extension connected (version 9.9.9).');
    await byName.search.handler({ query: 'q' });
    await byName.read_listing.handler({ url: '/r/a' });
    assert.deepEqual(
      sent.map((call) => call.type),
      ['ping', 'search', 'listing'],
    );
  });
});
