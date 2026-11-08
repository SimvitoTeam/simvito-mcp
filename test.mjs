// Smoke test: start the proxy over stdio, then initialize and list tools, prompts and resources from the hosted server.
import { spawn } from "node:child_process";

const child = spawn(process.execPath, [new URL("./index.js", import.meta.url).pathname], { stdio: ["pipe", "pipe", "inherit"] });
const pending = new Map();
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    const message = JSON.parse(line);
    pending.get(message.id)?.(message);
  }
});
let nextId = 1;
const request = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  const timer = setTimeout(() => reject(new Error(`${method}: no answer in 30 s`)), 30_000);
  pending.set(id, (message) => { clearTimeout(timer); message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result); });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
const check = (ok, what) => { if (!ok) throw new Error(`failed: ${what}`); console.log(`ok - ${what}`); };

try {
  const init = await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "simvito-mcp-test", version: "1" } });
  check(init.serverInfo?.name === "com.simvito/esim", "initialize returns com.simvito/esim");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  const { tools } = await request("tools/list");
  check(tools.some((t) => t.name === "search_plans") && tools.some((t) => t.name === "find_destination"), `tools/list has search_plans and find_destination (${tools.length} tools)`);
  const { prompts } = await request("prompts/list");
  check(prompts.length > 0, `prompts/list (${prompts.length} prompts)`);
  const { resources } = await request("resources/list");
  check(resources.some((r) => r.uri === "simvito://guide"), `resources/list has simvito://guide (${resources.length} resources)`);
  const found = await request("tools/call", { name: "find_destination", arguments: { query: "Japan" } });
  check(found.structuredContent?.destinations?.some((d) => d.slug === "japan"), "find_destination('Japan') finds japan");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  child.stdin.end();
  child.kill();
}
