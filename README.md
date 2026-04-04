# @cafeasp/netsuite-tools

A TypeScript toolkit for NetSuite developers — CLI and MCP server powered by a shared core library.

```
Terminal → CLI (Commander.js) ──┐
                                ├──► Core Library (Auth + API) ──► NetSuite REST API
Claude/AI → MCP Server (stdio) ─┘
```

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@cafeasp/netsuite-core](./packages/core) | Auth, REST API client, SuiteQL engine | [![npm](https://img.shields.io/npm/v/@cafeasp/netsuite-core)](https://www.npmjs.com/package/@cafeasp/netsuite-core) |
| [@cafeasp/netsuite-cli](./packages/cli) | Terminal interface | [![npm](https://img.shields.io/npm/v/@cafeasp/netsuite-cli)](https://www.npmjs.com/package/@cafeasp/netsuite-cli) |
| [@cafeasp/netsuite-mcp](./packages/mcp-server) | MCP server for AI clients | [![npm](https://img.shields.io/npm/v/@cafeasp/netsuite-mcp)](https://www.npmjs.com/package/@cafeasp/netsuite-mcp) |

## Quick Start

### CLI

```bash
npm install -g @cafeasp/netsuite-cli

# Configure credentials
netsuite config init

# Test connection
netsuite info

# Query data
netsuite query "SELECT id, companyname FROM customer" --limit 10

# Get a record
netsuite record get customer 123 --format json

# List records
netsuite record list item --limit 20
```

### MCP Server (Claude Code)

```bash
npm install -g @cafeasp/netsuite-mcp

claude mcp add netsuite-mcp -e NETSUITE_ACCOUNT_ID=YOUR_ID -e NETSUITE_CONSUMER_KEY=YOUR_KEY -e NETSUITE_CONSUMER_SECRET=YOUR_SECRET -e NETSUITE_TOKEN_ID=YOUR_TOKEN -e NETSUITE_TOKEN_SECRET=YOUR_SECRET -e NETSUITE_AUTH_METHOD=tba -- netsuite-mcp
```

Then in Claude Code:
- "Show me the first 5 customers in NetSuite"
- "What fields are available on the salesorder record?"
- "Run this SuiteQL: SELECT id, tranid FROM transaction WHERE type = 'SalesOrd'"

### Core Library

```bash
npm install @cafeasp/netsuite-core
```

```typescript
import {
  loadConfig,
  createAuthProvider,
  NetSuiteClient,
  SuiteQLClient,
} from "@cafeasp/netsuite-core";

const config = loadConfig();
const auth = createAuthProvider(config);
const client = new NetSuiteClient(auth, config.accountId);
const suiteql = new SuiteQLClient(client);

const result = await suiteql.query("SELECT id, companyname FROM customer", { limit: 10 });
console.log(result.items);
```

## Authentication

The tool uses **Token-Based Authentication (TBA)** — the most common auth method for NetSuite developers.

You need four values from your NetSuite account:
1. **Consumer Key** and **Consumer Secret** (from an Integration Record)
2. **Token ID** and **Token Secret** (from an Access Token)

See each package's README for detailed setup instructions.

## Configuration

Credentials are stored in `~/.netsuite/config.json` with named profiles:

```bash
# Set up default profile
netsuite config init

# Use a specific profile
netsuite --profile sandbox query "SELECT 1 FROM dual"
```

Environment variables override file config:
- `NETSUITE_ACCOUNT_ID`
- `NETSUITE_CONSUMER_KEY`
- `NETSUITE_CONSUMER_SECRET`
- `NETSUITE_TOKEN_ID`
- `NETSUITE_TOKEN_SECRET`

## Requirements

- Node.js >= 18
- NetSuite account with REST Web Services and TBA enabled

## License

MIT
