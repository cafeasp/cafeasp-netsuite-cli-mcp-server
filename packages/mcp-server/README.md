# @cafeasp/netsuite-mcp

A read-only MCP (Model Context Protocol) server for NetSuite. Gives AI assistants like Claude the ability to query and browse your NetSuite data.

## Installation

```bash
npm install -g @cafeasp/netsuite-mcp
```

## Setup with Claude Code

```bash
claude mcp add netsuite-mcp -e NETSUITE_ACCOUNT_ID=YOUR_ID -e NETSUITE_CONSUMER_KEY=YOUR_KEY -e NETSUITE_CONSUMER_SECRET=YOUR_SECRET -e NETSUITE_TOKEN_ID=YOUR_TOKEN -e NETSUITE_TOKEN_SECRET=YOUR_SECRET -e NETSUITE_AUTH_METHOD=tba -- netsuite-mcp
```

Verify it's connected:
```bash
claude mcp list
```

## Tools

### `netsuite_query`
Execute a SuiteQL query against NetSuite.

**Input:** `{ sql: string, limit?: number, offset?: number }`

Example prompts:
- "Show me the first 10 customers"
- "Find all sales orders from this month"
- "Count how many active items we have"

### `netsuite_get_record`
Fetch a NetSuite record by type and internal ID.

**Input:** `{ recordType: string, id: string, fields?: string[] }`

Example prompts:
- "Look up customer 1234"
- "Show me the details of sales order 5678"

### `netsuite_list_records`
List NetSuite records of a given type.

**Input:** `{ recordType: string, limit?: number, offset?: number, q?: string }`

Example prompts:
- "List the first 20 vendors"
- "Show me all items"

### `netsuite_list_record_types`
List common NetSuite record types with descriptions.

Example prompts:
- "What record types are available in NetSuite?"

### `netsuite_describe_record`
Get field metadata for a NetSuite record type.

**Input:** `{ recordType: string }`

Example prompts:
- "What fields does the customer record have?"
- "Describe the salesorder record type"

## Configuration

The server loads config from environment variables or `~/.netsuite/config.json`. Environment variables take precedence.

### Required Environment Variables

```
NETSUITE_ACCOUNT_ID     — NetSuite account ID (e.g., 1234567_SB1)
NETSUITE_CONSUMER_KEY   — OAuth consumer key
NETSUITE_CONSUMER_SECRET — OAuth consumer secret
NETSUITE_TOKEN_ID       — TBA token ID
NETSUITE_TOKEN_SECRET   — TBA token secret
```

## Compatibility

Works with any MCP-compatible AI client:
- Claude Code (CLI, Desktop, Web)
- Claude Desktop
- Cursor
- Windsurf
- Cline
- Continue
- Zed
- Any custom MCP client

## Security

This server is **read-only** — it cannot create, update, or delete records. Write operations may be added in a future version with explicit confirmation mechanisms.

## Related Packages

- [@cafeasp/netsuite-core](../core) — Core library
- [@cafeasp/netsuite-cli](../cli) — Terminal interface

## License

MIT
