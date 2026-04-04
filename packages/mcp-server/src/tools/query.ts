import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SuiteQLClient } from "@cafeasp/netsuite-core";
import { z } from "zod";

export function registerQueryTool(server: McpServer, suiteql: SuiteQLClient): void {
  server.registerTool(
    "netsuite_query",
    {
      title: "NetSuite SuiteQL Query",
      description:
        "Execute a SuiteQL query against NetSuite (read-only). " +
        "SuiteQL uses Oracle-like syntax. Do NOT use LIMIT in the SQL — use the limit parameter instead.",
      inputSchema: {
        sql: z.string().describe("SuiteQL query to execute"),
        limit: z.number().optional().describe("Maximum rows to return (default: 1000)"),
        offset: z.number().optional().describe("Starting row offset for pagination"),
      },
    },
    async ({ sql, limit, offset }) => {
      try {
        const result = await suiteql.query(sql, { limit, offset });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                  items: result.items,
                  count: result.count,
                  totalResults: result.totalResults,
                  hasMore: result.hasMore,
                  offset: result.offset,
                }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatError(err),
            },
          ],
          isError: true,
        };
      }
    }
  );
}

export function formatError(err: unknown): string {
  if (err instanceof Error) {
    const nsErr = err as Error & { errorCode?: string; statusCode?: number };
    if (nsErr.errorCode) {
      return `NetSuite Error [${nsErr.errorCode}]: ${nsErr.message}`;
    }
    return err.message;
  }
  return String(err);
}
