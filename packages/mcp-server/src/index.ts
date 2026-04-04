import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  loadConfig,
  createAuthProvider,
  NetSuiteClient,
  SuiteQLClient,
} from "@cafeasp/netsuite-core";
import { registerQueryTool } from "./tools/query.js";
import { registerRecordTools } from "./tools/record.js";
import { registerMetadataTools } from "./tools/metadata.js";

const server = new McpServer({
  name: "netsuite-mcp",
  version: "0.1.0",
});

// Load config from env vars or ~/.netsuite/config.json
const config = loadConfig();
const auth = createAuthProvider(config);
const client = new NetSuiteClient(auth, config.accountId);
const suiteql = new SuiteQLClient(client);

// Register tools
registerQueryTool(server, suiteql);
registerRecordTools(server, client);
registerMetadataTools(server, client);

// Start server with stdio transport
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
