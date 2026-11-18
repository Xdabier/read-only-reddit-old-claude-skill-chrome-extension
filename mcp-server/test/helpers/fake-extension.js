import net from 'node:net';

const HEADERS = { 'X-Roro-Client': 'extension', 'Content-Type': 'application/json' };

export function freePort() {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// Polls the bridge like the real extension and answers with `respond(command)`.
export function startFakeExtension(port, respond) {
  const base = `http://127.0.0.1:${port}`;
  const abort = new AbortController();
  const post = (path, body) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: HEADERS,
      body: body && JSON.stringify(body),
      signal: abort.signal,
    });

  const loop = (async () => {
    while (!abort.signal.aborted) {
      try {
        const res = await post('/poll');
        if (res.status !== 200) continue;
        const command = await res.json();
        await post('/result', { id: command.id, ...respond(command) });
      } catch {
        if (!abort.signal.aborted) await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  })();

  return {
    async stop() {
      abort.abort();
      await loop;
    },
  };
}
