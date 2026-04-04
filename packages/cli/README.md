# @cafeasp/netsuite-cli

NetSuite CLI — query, browse, and manage NetSuite from the terminal.

## Installation

```bash
npm install -g @cafeasp/netsuite-cli
```

## Setup

```bash
# Interactive setup wizard
netsuite config init

# Test connection
netsuite info
```

## Commands

### `netsuite config init`
Interactive wizard to set up TBA credentials. Saves to `~/.netsuite/config.json`.

### `netsuite config show`
Display current configuration with secrets masked.

### `netsuite config profiles`
List all saved profiles.

### `netsuite info`
Test connectivity and display account info (server time, auth method).

### `netsuite query <sql>`
Execute a SuiteQL query.

```bash
netsuite query "SELECT id, companyname, email FROM customer" --limit 10
netsuite query "SELECT id, tranid FROM transaction WHERE type = 'SalesOrd'" --format json
netsuite query "SELECT id, itemid FROM item" --format csv --output items.csv
```

Options:
- `-l, --limit <n>` — Maximum rows
- `-o, --offset <n>` — Starting offset
- `-f, --format <type>` — Output format: `table` (default), `json`, `csv`
- `--output <file>` — Write results to file

### `netsuite record get <type> <id>`
Fetch a single record.

```bash
netsuite record get customer 123
netsuite record get salesorder 456 --format json
netsuite record get item 789 --fields id,itemid,displayname
```

### `netsuite record list <type>`
List records of a type.

```bash
netsuite record list customer --limit 20
netsuite record list item --limit 50 --fields id,itemid
```

### `netsuite record create <type>`
Create a record.

```bash
netsuite record create customer --data '{"companyname":"Acme Corp","email":"info@acme.com"}'
netsuite record create vendor --file vendor-data.json
```

### `netsuite record update <type> <id>`
Update a record.

```bash
netsuite record update customer 123 --data '{"email":"new@acme.com"}'
```

### `netsuite record delete <type> <id>`
Delete a record (prompts for confirmation).

```bash
netsuite record delete customer 456
netsuite record delete customer 456 --yes  # skip confirmation
```

## Global Options

- `-p, --profile <name>` — Configuration profile to use (default: "default")
- `-f, --format <type>` — Default output format
- `-V, --version` — Show version
- `-h, --help` — Show help

## Related Packages

- [@cafeasp/netsuite-core](../core) — Core library
- [@cafeasp/netsuite-mcp](../mcp-server) — MCP server for AI clients

## License

MIT
