import type { NetSuiteClient } from "./client.js";
import type { SuiteQLResponse } from "./types.js";

export interface SuiteQLQueryOptions {
  limit?: number;
  offset?: number;
}

export class SuiteQLClient {
  private readonly client: NetSuiteClient;

  constructor(client: NetSuiteClient) {
    this.client = client;
  }

  async query(sql: string, options?: SuiteQLQueryOptions): Promise<SuiteQLResponse> {
    let path = "/query/v1/suiteql";
    const params = new URLSearchParams();

    if (options?.limit !== undefined) params.set("limit", String(options.limit));
    if (options?.offset !== undefined) params.set("offset", String(options.offset));

    const query = params.toString();
    if (query) path += `?${query}`;

    const result = await this.client.request(
      "POST",
      path,
      { q: sql },
      { Prefer: "transient" }
    );

    return result as SuiteQLResponse;
  }

  async queryAll(sql: string): Promise<SuiteQLResponse> {
    const allItems: Record<string, unknown>[] = [];
    let offset = 0;
    const limit = 1000;
    let totalResults = 0;

    while (true) {
      const page = await this.query(sql, { limit, offset });
      allItems.push(...page.items);
      totalResults = page.totalResults;

      if (!page.hasMore) break;
      offset += page.count;
    }

    return {
      items: allItems,
      links: [],
      totalResults,
      count: allItems.length,
      hasMore: false,
      offset: 0,
    };
  }
}
