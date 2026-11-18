import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { BRIDGE_URL, REDDIT_ORIGIN } from '../src/config.js';
import { DEFAULT_PORT, HOST } from '../../mcp-server/src/bridge/http-server.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const manifest = readJson('../manifest.json');
const pkg = readJson('../../package.json');

describe('extension manifest', () => {
  it('can only reach old.reddit.com and the local bridge', () => {
    assert.deepEqual(manifest.host_permissions, [`${REDDIT_ORIGIN}/*`, `${BRIDGE_URL}/*`]);
  });

  it('asks for no more permissions than it needs', () => {
    assert.deepEqual(manifest.permissions, ['scripting', 'alarms', 'storage']);
  });

  it('uses the same bridge address as the MCP server', () => {
    assert.equal(BRIDGE_URL, `http://${HOST}:${DEFAULT_PORT}`);
  });

  it('has the same version as package.json', () => {
    assert.equal(manifest.version, pkg.version);
  });
});
