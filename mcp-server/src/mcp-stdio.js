import readline from 'node:readline';

const DEFAULT_PROTOCOL = '2025-06-18';
const METHOD_NOT_FOUND = -32601;
const INTERNAL_ERROR = -32603;

const text = (value, isError = false) => ({ content: [{ type: 'text', text: value }], isError });

export function createDispatcher({ info, tools }) {
  const byName = new Map(tools.map((tool) => [tool.name, tool]));

  const methods = {
    initialize: ({ protocolVersion }) => ({
      protocolVersion: protocolVersion ?? DEFAULT_PROTOCOL,
      capabilities: { tools: {} },
      serverInfo: info,
    }),
    ping: () => ({}),
    'tools/list': () => ({
      tools: tools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    }),
    'tools/call': async ({ name, arguments: args = {} }) => {
      const tool = byName.get(name);
      if (!tool) return text(`Unknown tool: ${name}`, true);
      try {
        return text(await tool.handler(args));
      } catch (error) {
        return text(error.message, true);
      }
    },
  };

  return ({ method, params = {} }) => {
    const handler = methods[method];
    if (!handler)
      throw Object.assign(new Error(`Method not found: ${method}`), { code: METHOD_NOT_FOUND });
    return handler(params);
  };
}

// Minimal MCP server over stdio: newline-delimited JSON-RPC, tools only.
export function serveStdio(options) {
  const dispatch = createDispatcher(options);
  const reply = (id, body) =>
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`);

  const lines = readline.createInterface({ input: process.stdin });
  lines.on('line', async (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id === undefined || !message.method) return;

    try {
      reply(message.id, { result: await dispatch(message) });
    } catch (error) {
      reply(message.id, { error: { code: error.code ?? INTERNAL_ERROR, message: error.message } });
    }
  });
  lines.on('close', () => process.exit(0));
}
