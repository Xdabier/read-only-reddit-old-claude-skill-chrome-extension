import { CommandQueue } from './command-queue.js';
import { DEFAULT_PORT, listen } from './http-server.js';
import { forward, PeerUnreachable } from './peer.js';

// The first MCP server process owns the port and talks to the extension.
// Later processes forward their commands to it, and take over if it exits.
export function createBridge({ port = DEFAULT_PORT, queue = new CommandQueue() } = {}) {
  let listening = null;

  const ownsPort = async () => {
    listening ??= listen(queue, port);
    const server = await listening;
    if (!server) listening = null;
    return Boolean(server);
  };

  return {
    start: ownsPort,

    async stop() {
      const server = await listening;
      listening = null;
      if (!server) return;
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },

    async send(type, params = {}) {
      if (await ownsPort()) return queue.enqueue(type, params);
      try {
        return await forward(type, params, port);
      } catch (error) {
        if (!(error instanceof PeerUnreachable)) throw error;
        if (!(await ownsPort()))
          throw new Error('Could not reach the bridge. Try again.', { cause: error });
        return queue.enqueue(type, params);
      }
    },
  };
}
