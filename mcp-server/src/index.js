#!/usr/bin/env node
import { createBridge } from './bridge/index.js';
import { serveStdio } from './mcp-stdio.js';
import { createTools } from './tools.js';

const bridge = createBridge();
bridge.start();

serveStdio({
  info: { name: 'read-only-reddit-old', version: '1.0.0' },
  tools: createTools(bridge),
});
