import type { AuthProvider } from "../auth/types.js";
import { NetSuiteError } from "./types.js";

export interface GetRecordOptions {
  expandSubResources?: boolean;
  fields?: string[];
}

export interface ListRecordsOptions {
  limit?: number;
  offset?: number;
  q?: string;
  fields?: string[];
}

export class NetSuiteClient {
  readonly baseUrl: string;
  private readonly auth: AuthProvider;

  constructor(auth: AuthProvider, accountId: string) {
    this.auth = auth;
    const formattedAccountId = accountId.toLowerCase().replace(/_/g, "-");
    this.baseUrl = `https://${formattedAccountId}.suitetalk.api.netsuite.com/services/rest`;
  }

  async request(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const authHeaders = await this.auth.getAuthHeaders(method, url);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      let errorBody: Record<string, unknown>;
      try {
        errorBody = (await response.json()) as Record<string, unknown>;
      } catch {
        errorBody = {};
      }
      throw NetSuiteError.fromResponse(response.status, errorBody);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }

    return response.json();
  }

  async getRecord(
    recordType: string,
    id: string,
    options?: GetRecordOptions
  ): Promise<unknown> {
    let path = `/record/v1/${recordType}/${id}`;
    const params = new URLSearchParams();

    if (options?.expandSubResources) {
      params.set("expandSubResources", "true");
    }
    if (options?.fields?.length) {
      params.set("fields", options.fields.join(","));
    }

    const query = params.toString();
    if (query) path += `?${query}`;

    return this.request("GET", path);
  }

  async createRecord(recordType: string, body: unknown): Promise<unknown> {
    return this.request("POST", `/record/v1/${recordType}`, body);
  }

  async updateRecord(
    recordType: string,
    id: string,
    body: unknown
  ): Promise<unknown> {
    return this.request("PATCH", `/record/v1/${recordType}/${id}`, body);
  }

  async deleteRecord(recordType: string, id: string): Promise<unknown> {
    return this.request("DELETE", `/record/v1/${recordType}/${id}`);
  }

  async listRecords(
    recordType: string,
    options?: ListRecordsOptions
  ): Promise<unknown> {
    let path = `/record/v1/${recordType}`;
    const params = new URLSearchParams();

    if (options?.limit !== undefined) params.set("limit", String(options.limit));
    if (options?.offset !== undefined) params.set("offset", String(options.offset));
    if (options?.q) params.set("q", options.q);
    if (options?.fields?.length) params.set("fields", options.fields.join(","));

    const query = params.toString();
    if (query) path += `?${query}`;

    return this.request("GET", path);
  }
}
