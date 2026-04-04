import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerMetadataTools } from "../tools/metadata.js";
import type { NetSuiteClient } from "@cafeasp/netsuite-core";

describe("metadata tools", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockClient: { request: ReturnType<typeof vi.fn> };
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    mockServer = { registerTool: vi.fn() };
    mockClient = { request: vi.fn() };

    registerMetadataTools(
      mockServer as unknown as Parameters<typeof registerMetadataTools>[0],
      mockClient as unknown as NetSuiteClient
    );

    handlers = {};
    for (const call of mockServer.registerTool.mock.calls) {
      handlers[call[0]] = call[2];
    }
  });

  describe("netsuite_list_record_types", () => {
    it("registers tool with correct name", () => {
      expect(handlers).toHaveProperty("netsuite_list_record_types");
    });

    it("returns curated list of record types", async () => {
      const result = (await handlers.netsuite_list_record_types({})) as {
        content: { text: string }[];
      };

      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Should include common types
      const types = parsed.map((r: { type: string }) => r.type);
      expect(types).toContain("customer");
      expect(types).toContain("salesorder");
      expect(types).toContain("item");
    });
  });

  describe("netsuite_describe_record", () => {
    it("registers tool with correct name", () => {
      expect(handlers).toHaveProperty("netsuite_describe_record");
    });

    it("calls client.request for metadata-catalog", async () => {
      mockClient.request.mockResolvedValue({
        properties: {
          id: { type: "integer", title: "Internal ID" },
          companyname: { type: "string", title: "Company Name" },
        },
      });

      const result = await handlers.netsuite_describe_record({
        recordType: "customer",
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        "GET",
        "/record/v1/metadata-catalog/customer"
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: expect.stringContaining('"companyname"'),
          },
        ],
      });
    });

    it("returns error on failure", async () => {
      mockClient.request.mockRejectedValue(new Error("Not found"));

      const result = await handlers.netsuite_describe_record({
        recordType: "nonexistent",
      });

      expect(result).toEqual({
        content: [{ type: "text", text: expect.stringContaining("Not found") }],
        isError: true,
      });
    });
  });
});
