#!/usr/bin/env node
import pkg from '../../package.json' with { type: 'json' };
import { createBridge } from './bridge/index.js';
import { serveStdio } from './mcp-stdio.js';
import { createTools } from './tools.js';

const bridge = createBridge();
bridge.start();

serveStdio({
  info: { name: 'read-only-reddit-old', version: pkg.version },
  tools: createTools(bridge),
});
