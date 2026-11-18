import { runCommand } from './commands.js';
import { BRIDGE_URL, CLIENT_HEADER } from './config.js';
import { touch } from './keepalive.js';

let running = false;

async function post(path, body) {
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: { ...CLIENT_HEADER, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Bridge answered ${res.status}`);
  return res.status === 200 ? res.json() : null;
}

async function execute(command) {
  try {
    return { id: command.id, ok: true, data: await runCommand(command) };
  } catch (error) {
    return { id: command.id, ok: false, error: error.message };
  }
}

// Long-polls the local MCP server for commands, one at a time.
// Stops when the server is not running. The retry alarm starts it again.
export async function runBridgeLoop() {
  if (running) return;
  running = true;
  try {
    for (;;) {
      await touch();
      const command = await post('/poll');
      if (command) await post('/result', await execute(command));
    }
  } catch {
    // bridge not reachable
  } finally {
    running = false;
  }
}
