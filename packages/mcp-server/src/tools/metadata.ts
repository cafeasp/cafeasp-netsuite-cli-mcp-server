import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NetSuiteClient } from "@cafeasp/netsuite-core";
import { z } from "zod";
import { formatError } from "./query.js";

const COMMON_RECORD_TYPES = [
  { type: "customer", description: "Customers and companies" },
  { type: "contact", description: "Contact records associated with customers/vendors" },
  { type: "vendor", description: "Vendors and suppliers" },
  { type: "employee", description: "Employee records" },
  { type: "item", description: "Inventory, non-inventory, service, and other item types" },
  { type: "salesorder", description: "Sales orders" },
  { type: "invoice", description: "Invoices" },
  { type: "purchaseorder", description: "Purchase orders" },
  { type: "vendorbill", description: "Vendor bills" },
  { type: "journalentry", description: "Journal entries" },
  { type: "creditmemo", description: "Credit memos" },
  { type: "customerpayment", description: "Customer payments" },
  { type: "estimate", description: "Estimates / quotes" },
  { type: "opportunity", description: "Opportunities (CRM)" },
  { type: "task", description: "Tasks (CRM)" },
  { type: "phonecall", description: "Phone call records (CRM)" },
  { type: "department", description: "Departments" },
  { type: "location", description: "Locations" },
  { type: "subsidiary", description: "Subsidiaries" },
  { type: "classification", description: "Classes" },
  { type: "account", description: "Chart of accounts" },
  { type: "currency", description: "Currencies" },
];

export function registerMetadataTools(server: McpServer, client: NetSuiteClient): void {
  server.registerTool(
    "netsuite_list_record_types",
    {
      title: "List NetSuite Record Types",
      description:
        "List common NetSuite record types with descriptions. " +
        "Use these type names with other NetSuite tools.",
    },
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(COMMON_RECORD_TYPES),
          },
        ],
      };
    }
  );

  server.registerTool(
    "netsuite_describe_record",
    {
      title: "Describe NetSuite Record",
      description:
        "Get field metadata for a NetSuite record type. " +
        "Returns field names, types, and whether they are required.",
      inputSchema: {
        recordType: z
          .string()
          .describe("Record type to describe (e.g., customer, salesorder)"),
      },
    },
    async ({ recordType }) => {
      try {
        const result = await client.request(
          "GET",
          `/record/v1/metadata-catalog/${recordType}`
        );

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
