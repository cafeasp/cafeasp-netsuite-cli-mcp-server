import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerQueryTool } from "../tools/query.js";
import type { SuiteQLClient } from "@cafeasp/netsuite-core";

describe("netsuite_query tool", () => {
  let mockServer: { registerTool: ReturnType<typeof vi.fn> };
  let mockSuiteQL: { query: ReturnType<typeof vi.fn> };
  let handler: (args: Record<string, unknown>) => Promise<unknown>;

  beforeEach(() => {
    mockServer = { registerTool: vi.fn() };
    mockSuiteQL = { query: vi.fn() };

    registerQueryTool(
      mockServer as unknown as Parameters<typeof registerQueryTool>[0],
      mockSuiteQL as unknown as SuiteQLClient
    );

    // Extract the handler (third argument to registerTool)
    handler = mockServer.registerTool.mock.calls[0][2];
  });

  it("registers tool with correct name", () => {
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "netsuite_query",
      expect.objectContaining({
        description: expect.stringContaining("SuiteQL"),
      }),
      expect.any(Function)
    );
  });

  it("calls suiteql.query with sql and options", async () => {
    mockSuiteQL.query.mockResolvedValue({
      items: [{ id: "1", companyname: "Acme" }],
      count: 1,
      totalResults: 1,
      hasMore: false,
      offset: 0,
    });

    const result = await handler({ sql: "SELECT id FROM customer", limit: 10, offset: 5 });

    expect(mockSuiteQL.query).toHaveBeenCalledWith(
      "SELECT id FROM customer",
      { limit: 10, offset: 5 }
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining('"companyname":"Acme"'),
        },
      ],
    });
  });

  it("returns error content on failure", async () => {
    const error = new Error("Invalid query");
    (error as unknown as Record<string, unknown>).errorCode = "INVALID_SEARCH";
    mockSuiteQL.query.mockRejectedValue(error);

    const result = await handler({ sql: "SELECT bad FROM nothing" });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Invalid query"),
        },
      ],
      isError: true,
    });
  });
});
