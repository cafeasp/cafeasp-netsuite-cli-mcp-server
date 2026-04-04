import { describe, it, expect, vi, beforeEach } from "vitest";
import { NetSuiteClient } from "../api/client.js";
import { NetSuiteError } from "../api/types.js";
import type { AuthProvider } from "../auth/types.js";

const mockAuthProvider: AuthProvider = {
  getAuthHeaders: vi.fn().mockResolvedValue({
    Authorization: "OAuth mock-auth-header",
  }),
  getAuthMethod: () => "tba",
};

describe("NetSuiteClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockAuthProvider.getAuthHeaders).mockResolvedValue({
      Authorization: "OAuth mock-auth-header",
    });
  });

  describe("account ID formatting", () => {
    it("formats account ID for URL (lowercase, hyphens to underscores)", () => {
      const client = new NetSuiteClient(mockAuthProvider, "1234567-SB1");
      expect(client.baseUrl).toBe(
        "https://1234567_sb1.suitetalk.api.netsuite.com/services/rest"
      );
    });

    it("handles plain numeric account ID", () => {
      const client = new NetSuiteClient(mockAuthProvider, "1234567");
      expect(client.baseUrl).toBe(
        "https://1234567.suitetalk.api.netsuite.com/services/rest"
      );
    });
  });

  describe("request", () => {
    it("sends GET request with auth headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "123", companyname: "Acme" }),
        headers: new Headers({ "content-type": "application/json" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

      const client = new NetSuiteClient(mockAuthProvider, "1234567");
      const result = await client.request("GET", "/record/v1/customer/123");

      expect(fetch).toHaveBeenCalledWith(
        "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "OAuth mock-auth-header",
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual({ id: "123", companyname: "Acme" });
    });

    it("sends POST request with body", async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
        headers: new Headers({ "content-type": "application/json" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

      const client = new NetSuiteClient(mockAuthProvider, "1234567");
      await client.request("POST", "/record/v1/customer", {
        companyname: "Acme",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ companyname: "Acme" }),
        })
      );
    });

    it("throws NetSuiteError on non-OK response", async () => {
      const errorBody = {
        "o:errorDetails": [
          {
            "o:errorCode": "RCRD_DSNT_EXIST",
            detail: "Record does not exist",
          },
        ],
      };
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorBody),
        headers: new Headers({ "content-type": "application/json" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

      const client = new NetSuiteClient(mockAuthProvider, "1234567");

      await expect(
        client.request("GET", "/record/v1/customer/999")
      ).rejects.toThrow(NetSuiteError);

      try {
        await client.request("GET", "/record/v1/customer/999");
      } catch (e) {
        const err = e as NetSuiteError;
        expect(err.statusCode).toBe(404);
        expect(err.errorCode).toBe("RCRD_DSNT_EXIST");
        expect(err.message).toBe("Record does not exist");
      }
    });

    it("passes additional headers", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers({ "content-type": "application/json" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

      const client = new NetSuiteClient(mockAuthProvider, "1234567");
      await client.request("POST", "/query/v1/suiteql", { q: "SELECT 1" }, {
        Prefer: "transient",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Prefer: "transient",
          }),
        })
      );
    });
  });

  describe("CRUD methods", () => {
    let client: NetSuiteClient;

    beforeEach(() => {
      client = new NetSuiteClient(mockAuthProvider, "1234567");
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "123" }),
        headers: new Headers({ "content-type": "application/json" }),
      } as Response);
    });

    it("getRecord sends GET to /record/v1/{type}/{id}", async () => {
      await client.getRecord("customer", "123");
      expect(fetch).toHaveBeenCalledWith(
        "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("getRecord passes expandSubResources option", async () => {
      await client.getRecord("customer", "123", {
        expandSubResources: true,
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("expandSubResources=true"),
        expect.any(Object)
      );
    });

    it("createRecord sends POST to /record/v1/{type}", async () => {
      await client.createRecord("customer", { companyname: "Acme" });
      expect(fetch).toHaveBeenCalledWith(
        "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ companyname: "Acme" }),
        })
      );
    });

    it("updateRecord sends PATCH to /record/v1/{type}/{id}", async () => {
      await client.updateRecord("customer", "123", { companyname: "Acme Corp" });
      expect(fetch).toHaveBeenCalledWith(
        "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ companyname: "Acme Corp" }),
        })
      );
    });

    it("deleteRecord sends DELETE to /record/v1/{type}/{id}", async () => {
      await client.deleteRecord("customer", "123");
      expect(fetch).toHaveBeenCalledWith(
        "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("listRecords sends GET with query params", async () => {
      await client.listRecords("customer", {
        limit: 10,
        offset: 5,
        q: 'companyname CONTAIN "Acme"',
        fields: ["id", "companyname", "email"],
      });

      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("offset=5");
      expect(calledUrl).toContain("q=");
      expect(calledUrl).toContain("fields=id%2Ccompanyname%2Cemail");
    });
  });
});
