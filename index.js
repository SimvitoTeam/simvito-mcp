#!/usr/bin/env node
// Simvito eSIM MCP server over stdio.
// It forwards every MCP message to the hosted server at mcp.simvito.com and sends the replies back,
// so clients that only run local (stdio) servers can use it. No API key; nothing is stored locally.
import { readFileSync } from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const endpoint = new URL(process.env.SIMVITO_MCP_URL || "https://mcp.simvito.com/mcp?src=npm");

const local = new StdioServerTransport();
const remote = new StreamableHTTPClientTransport(endpoint, {
  requestInit: { headers: { "user-agent": `simvito-mcp/${version} (+https://github.com/SimvitoTeam/simvito-mcp)` } },
});

/** Request ids of initialize calls, so the negotiated protocol version can be passed on to later requests. */
const initializing = new Set();

local.onmessage = (message) => {
  if (message.method === "initialize" && message.id !== undefined) initializing.add(message.id);
  remote.send(message).catch((error) => {
    if (message.id === undefined) return;
    local.send({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32603, message: `Could not reach ${endpoint.host}: ${error?.message ?? error}` },
    }).catch(() => {});
  });
};

remote.onmessage = (message) => {
  if (message.id !== undefined && initializing.delete(message.id) && message.result?.protocolVersion) {
    remote.setProtocolVersion?.(message.result.protocolVersion);
  }
  local.send(message).catch(() => {});
};

remote.onerror = (error) => console.error(`simvito-mcp: ${error?.message ?? error}`);
local.onclose = () => { remote.close().finally(() => process.exit(0)); };

await remote.start();
await local.start();
