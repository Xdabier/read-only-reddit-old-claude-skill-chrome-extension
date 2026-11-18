import { CLIENT_HEADER, HOST } from './http-server.js';

export class PeerUnreachable extends Error {}

// Sends a command through the MCP server process that owns the port.
export async function forward(type, params, port) {
  let res;
  try {
    res = await fetch(`http://${HOST}:${port}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CLIENT_HEADER]: 'peer' },
      body: JSON.stringify({ type, params }),
    });
  } catch {
    throw new PeerUnreachable();
  }
  if (!res.ok) throw new Error(`Port ${port} is used by another program (status ${res.status}).`);

  const { ok, data, error } = await res.json();
  if (!ok) throw new Error(error);
  return data;
}
