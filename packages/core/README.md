# @cafeasp/netsuite-core

NetSuite REST API and SuiteQL client library for Node.js. Zero runtime dependencies — uses only Node.js built-in modules.

## Installation

```bash
npm install @cafeasp/netsuite-core
```

## Quick Start

```typescript
import {
  loadConfig,
  createAuthProvider,
  NetSuiteClient,
  SuiteQLClient,
} from "@cafeasp/netsuite-core";

// Load config from ~/.netsuite/config.json or environment variables
const config = loadConfig();
const auth = createAuthProvider(config);
const client = new NetSuiteClient(auth, config.accountId);
const suiteql = new SuiteQLClient(client);

// Run a SuiteQL query
const customers = await suiteql.query(
  "SELECT id, companyname, email FROM customer",
  { limit: 10 }
);
console.log(customers.items);

// Auto-paginate through all results
const allCustomers = await suiteql.queryAll(
  "SELECT id, companyname FROM customer"
);

// CRUD operations
const record = await client.getRecord("customer", "123");
const list = await client.listRecords("item", { limit: 50 });
await client.createRecord("customer", { companyname: "Acme Corp" });
await client.updateRecord("customer", "123", { email: "new@acme.com" });
await client.deleteRecord("customer", "456");
```

## Authentication

Uses **Token-Based Authentication (TBA)** with HMAC-SHA256 signing.

### Setup in NetSuite

1. Enable **REST Web Services** and **Token-Based Authentication** in Setup > Company > Enable Features
2. Create an **Integration Record** — save the Consumer Key and Consumer Secret
3. Create an **Access Token** — save the Token ID and Token Secret

### Configuration

**Option A: Config file** (`~/.netsuite/config.json`)

```json
{
  "profiles": {
    "default": {
      "authMethod": "tba",
      "accountId": "YOUR_ACCOUNT_ID",
      "consumerKey": "...",
      "consumerSecret": "...",
      "tokenId": "...",
      "tokenSecret": "..."
    }
  }
}
```

**Option B: Environment variables**

```bash
export NETSUITE_ACCOUNT_ID=YOUR_ACCOUNT_ID
export NETSUITE_CONSUMER_KEY=...
export NETSUITE_CONSUMER_SECRET=...
export NETSUITE_TOKEN_ID=...
export NETSUITE_TOKEN_SECRET=...
```

Environment variables override file config.

## API

### `loadConfig(options?)`
Load config from file and/or environment. Options: `{ profile?: string, configPath?: string }`

### `createAuthProvider(config)`
Create an auth provider from config. Returns an `AuthProvider` instance.

### `NetSuiteClient`
- `getRecord(type, id, options?)` — GET a record
- `listRecords(type, options?)` — List records with filtering
- `createRecord(type, body)` — Create a record
- `updateRecord(type, id, body)` — Update a record
- `deleteRecord(type, id)` — Delete a record
- `request(method, path, body?, headers?)` — Raw HTTP request

### `SuiteQLClient`
- `query(sql, options?)` — Execute SuiteQL (max 1000 rows per call)
- `queryAll(sql)` — Auto-paginate through all results

### `NetSuiteError`
Extends `Error` with `statusCode`, `errorCode`, and `body` properties. Use `NetSuiteError.fromResponse(status, body)` to parse NetSuite error responses.

## Related Packages

- [@cafeasp/netsuite-cli](../cli) — Terminal interface
- [@cafeasp/netsuite-mcp](../mcp-server) — MCP server for AI clients

## License

MIT
