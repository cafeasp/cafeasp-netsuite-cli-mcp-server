import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRecordTools } from "../tools/record.js";
import type { NetSuiteClient } from "@cafeasp/netsuite-core";

describe("record tools", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockClient: {
    getRecord: ReturnType<typeof vi.fn>;
    listRecords: ReturnType<typeof vi.fn>;
  };
  let handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    mockServer = { registerTool: vi.fn() };
    mockClient = {
      getRecord: vi.fn(),
      listRecords: vi.fn(),
    };

    registerRecordTools(
      mockServer as unknown as Parameters<typeof registerRecordTools>[0],
      mockClient as unknown as NetSuiteClient
    );

    // Extract handlers by tool name
    handlers = {};
    for (const call of mockServer.registerTool.mock.calls) {
      handlers[call[0]] = call[2];
    }
  });

  describe("netsuite_get_record", () => {
    it("registers tool with correct name", () => {
      expect(handlers).toHaveProperty("netsuite_get_record");
    });

    it("calls client.getRecord with type and id", async () => {
      mockClient.getRecord.mockResolvedValue({
        id: "123",
        companyname: "Acme",
      });

      const result = await handlers.netsuite_get_record({
        recordType: "customer",
        id: "123",
      });

      expect(mockClient.getRecord).toHaveBeenCalledWith("customer", "123", {
        fields: undefined,
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: expect.stringContaining('"companyname":"Acme"'),
          },
        ],
      });
    });

    it("passes fields option", async () => {
      mockClient.getRecord.mockResolvedValue({ id: "123" });

      await handlers.netsuite_get_record({
        recordType: "customer",
        id: "123",
        fields: ["id", "companyname"],
      });

      expect(mockClient.getRecord).toHaveBeenCalledWith("customer", "123", {
        fields: ["id", "companyname"],
      });
    });

    it("returns error on failure", async () => {
      mockClient.getRecord.mockRejectedValue(new Error("Not found"));

      const result = await handlers.netsuite_get_record({
        recordType: "customer",
        id: "999",
      });

      expect(result).toEqual({
        content: [{ type: "text", text: expect.stringContaining("Not found") }],
        isError: true,
      });
    });
  });

  describe("netsuite_list_records", () => {
    it("registers tool with correct name", () => {
      expect(handlers).toHaveProperty("netsuite_list_records");
    });

    it("calls client.listRecords with options", async () => {
      mockClient.listRecords.mockResolvedValue({
        items: [{ id: "1" }, { id: "2" }],
        count: 2,
        totalResults: 100,
        hasMore: true,
      });

      const result = await handlers.netsuite_list_records({
        recordType: "customer",
        limit: 10,
        q: "companyname CONTAIN Acme",
      });

      expect(mockClient.listRecords).toHaveBeenCalledWith("customer", {
        limit: 10,
        offset: undefined,
        q: "companyname CONTAIN Acme",
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: expect.stringContaining('"totalResults":100'),
          },
        ],
      });
    });
  });
});
