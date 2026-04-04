import { describe, it, expect, vi, beforeEach } from "vitest";
import { SuiteQLClient } from "../api/suiteql.js";
import { NetSuiteClient } from "../api/client.js";
import type { SuiteQLResponse } from "../api/types.js";

// Mock NetSuiteClient
vi.mock("../api/client.js", () => {
  return {
    NetSuiteClient: vi.fn(),
  };
});

describe("SuiteQLClient", () => {
  let mockRequest: ReturnType<typeof vi.fn>;
  let mockNetSuiteClient: NetSuiteClient;

  beforeEach(() => {
    mockRequest = vi.fn();
    mockNetSuiteClient = { request: mockRequest } as unknown as NetSuiteClient;
  });

  describe("query", () => {
    it("sends POST to /query/v1/suiteql with Prefer: transient header", async () => {
      const responseData: SuiteQLResponse = {
        items: [{ id: "1", companyname: "Acme" }],
        links: [],
        totalResults: 1,
        count: 1,
        hasMore: false,
        offset: 0,
      };
      mockRequest.mockResolvedValue(responseData);

      const suiteql = new SuiteQLClient(mockNetSuiteClient);
      const result = await suiteql.query("SELECT id, companyname FROM customer");

      expect(mockRequest).toHaveBeenCalledWith(
        "POST",
        "/query/v1/suiteql",
        { q: "SELECT id, companyname FROM customer" },
        { Prefer: "transient" }
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ id: "1", companyname: "Acme" });
    });

    it("passes limit and offset as query params", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        links: [],
        totalResults: 0,
        count: 0,
        hasMore: false,
        offset: 0,
      });

      const suiteql = new SuiteQLClient(mockNetSuiteClient);
      await suiteql.query("SELECT id FROM customer", { limit: 10, offset: 20 });

      expect(mockRequest).toHaveBeenCalledWith(
        "POST",
        "/query/v1/suiteql?limit=10&offset=20",
        { q: "SELECT id FROM customer" },
        { Prefer: "transient" }
      );
    });
  });

  describe("queryAll", () => {
    it("auto-paginates through all results", async () => {
      // First page: 3 items, hasMore=true
      mockRequest.mockResolvedValueOnce({
        items: [
          { id: "1" },
          { id: "2" },
          { id: "3" },
        ],
        links: [],
        totalResults: 5,
        count: 3,
        hasMore: true,
        offset: 0,
      } as SuiteQLResponse);

      // Second page: 2 items, hasMore=false
      mockRequest.mockResolvedValueOnce({
        items: [
          { id: "4" },
          { id: "5" },
        ],
        links: [],
        totalResults: 5,
        count: 2,
        hasMore: false,
        offset: 3,
      } as SuiteQLResponse);

      const suiteql = new SuiteQLClient(mockNetSuiteClient);
      const result = await suiteql.queryAll("SELECT id FROM customer");

      expect(result.items).toHaveLength(5);
      expect(result.items.map((i) => i.id)).toEqual(["1", "2", "3", "4", "5"]);
      expect(mockRequest).toHaveBeenCalledTimes(2);

      // Second call should use offset=3
      expect(mockRequest).toHaveBeenNthCalledWith(
        2,
        "POST",
        "/query/v1/suiteql?limit=1000&offset=3",
        { q: "SELECT id FROM customer" },
        { Prefer: "transient" }
      );
    });

    it("returns single page when hasMore is false", async () => {
      mockRequest.mockResolvedValueOnce({
        items: [{ id: "1" }],
        links: [],
        totalResults: 1,
        count: 1,
        hasMore: false,
        offset: 0,
      } as SuiteQLResponse);

      const suiteql = new SuiteQLClient(mockNetSuiteClient);
      const result = await suiteql.queryAll("SELECT id FROM customer");

      expect(result.items).toHaveLength(1);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });
});
