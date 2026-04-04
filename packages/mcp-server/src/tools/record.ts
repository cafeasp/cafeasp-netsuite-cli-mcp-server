import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NetSuiteClient } from "@cafeasp/netsuite-core";
import { z } from "zod";
import { formatError } from "./query.js";

export function registerRecordTools(server: McpServer, client: NetSuiteClient): void {
  server.registerTool(
    "netsuite_get_record",
    {
      title: "Get NetSuite Record",
      description: "Fetch a NetSuite record by type and internal ID",
      inputSchema: {
        recordType: z.string().describe("Record type (e.g., customer, salesorder, item)"),
        id: z.string().describe("Internal ID of the record"),
        fields: z
          .array(z.string())
          .optional()
          .describe("Specific fields to return (returns all if omitted)"),
      },
    },
    async ({ recordType, id, fields }) => {
      try {
        const result = await client.getRecord(recordType, id, { fields });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: formatError(err) }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "netsuite_list_records",
    {
      title: "List NetSuite Records",
      description: "List NetSuite records of a given type with optional filtering",
      inputSchema: {
        recordType: z.string().describe("Record type (e.g., customer, vendor, item)"),
        limit: z.number().optional().describe("Maximum records to return"),
        offset: z.number().optional().describe("Starting offset for pagination"),
        q: z.string().optional().describe("Filter expression (e.g., 'companyname CONTAIN Acme')"),
      },
    },
    async ({ recordType, limit, offset, q }) => {
      try {
        const result = await client.listRecords(recordType, { limit, offset, q });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: formatError(err) }],
          isError: true,
        };
      }
    }
  );
}
