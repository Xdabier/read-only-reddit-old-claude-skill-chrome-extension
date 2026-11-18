import http from 'node:http';

// Port must match the extension (manifest.json and src/config.js).
export const HOST = '127.0.0.1';
export const DEFAULT_PORT = 47821;
export const CLIENT_HEADER = 'x-roro-client';

const POLL_HOLD_MS = 20_000;
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const EXTENSION_ORIGIN = 'chrome-extension://';

const end = (res, status) => res.writeHead(status).end();

const json = (res, status, body) =>
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Body too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

// Web pages cannot pass this: the Host check stops DNS rebinding and the
// custom header forces a CORS preflight that only extensions get through.
function isTrusted(req, port) {
  const { host, origin } = req.headers;
  return (
    host === `${HOST}:${port}` &&
    (!origin || origin.startsWith(EXTENSION_ORIGIN)) &&
    Boolean(req.headers[CLIENT_HEADER])
  );
}

function answerPreflight(req, res) {
  const { origin } = req.headers;
  if (!origin?.startsWith(EXTENSION_ORIGIN)) return end(res, 403);
  res
    .writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': `content-type, ${CLIENT_HEADER}`,
    })
    .end();
}

function createRoutes(queue) {
  let held = null;

  const release = (command) => {
    if (!held) return;
    const { res, timer } = held;
    held = null;
    clearTimeout(timer);
    if (command) json(res, 200, command);
    else end(res, 204);
  };

  queue.onReady(() => {
    if (held) release(queue.take());
  });

  return {
    // Extension long poll: answers with the next command, or 204 after a while.
    '/poll': (req, res) => {
      release(null);
      const command = queue.take();
      if (command) return json(res, 200, command);
      held = { res, timer: setTimeout(() => release(null), POLL_HOLD_MS) };
      res.on('close', () => {
        if (held?.res !== res) return;
        clearTimeout(held.timer);
        held = null;
      });
    },

    '/result': async (req, res) => {
      queue.settle(await readJson(req));
      end(res, 204);
    },

    // Other MCP server processes (more Claude Code sessions) send through the port owner.
    '/command': async (req, res) => {
      const { type, params } = await readJson(req);
      try {
        json(res, 200, { ok: true, data: await queue.enqueue(type, params) });
      } catch (error) {
        json(res, 200, { ok: false, error: error.message });
      }
    },
  };
}

function createHandler(queue, port) {
  const routes = createRoutes(queue);

  return async (req, res) => {
    if (req.method === 'OPTIONS') return answerPreflight(req, res);
    const route = routes[req.url];
    if (req.method !== 'POST' || !route || !isTrusted(req, port)) return end(res, 403);

    const { origin } = req.headers;
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    try {
      await route(req, res);
    } catch {
      if (!res.headersSent) end(res, 400);
    }
  };
}

// Resolves with the server, or null when another process owns the port.
export function listen(queue, port = DEFAULT_PORT) {
  return new Promise((resolve) => {
    const server = http.createServer(createHandler(queue, port));
    server.once('error', () => resolve(null));
    server.listen(port, HOST, () => resolve(server));
  });
}
