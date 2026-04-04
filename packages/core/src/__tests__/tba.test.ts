import { describe, it, expect } from "vitest";
import { TBAAuth } from "../auth/tba.js";
import type { TBAConfig } from "../auth/types.js";

const testConfig: TBAConfig = {
  accountId: "1234567",
  consumerKey: "consumer-key-123",
  consumerSecret: "consumer-secret-456",
  tokenId: "token-id-789",
  tokenSecret: "token-secret-012",
};

describe("TBAAuth", () => {
  it("implements AuthProvider interface", () => {
    const auth = new TBAAuth(testConfig);
    expect(auth.getAuthMethod()).toBe("tba");
    expect(typeof auth.getAuthHeaders).toBe("function");
  });

  it("generates OAuth Authorization header", async () => {
    const auth = new TBAAuth(testConfig);
    const headers = await auth.getAuthHeaders(
      "GET",
      "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123"
    );

    expect(headers).toHaveProperty("Authorization");
    const authHeader = headers.Authorization;

    expect(authHeader).toContain('OAuth');
    expect(authHeader).toContain('oauth_consumer_key="consumer-key-123"');
    expect(authHeader).toContain('oauth_token="token-id-789"');
    expect(authHeader).toContain('oauth_signature_method="HMAC-SHA256"');
    expect(authHeader).toContain('oauth_version="1.0"');
    expect(authHeader).toContain("oauth_nonce=");
    expect(authHeader).toContain("oauth_timestamp=");
    expect(authHeader).toContain("oauth_signature=");
  });

  it("generates deterministic signature with fixed nonce and timestamp", async () => {
    const auth = new TBAAuth(testConfig);
    const url = "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123";

    const signature = auth.generateSignature("GET", url, "fixed-nonce", "1700000000");

    expect(signature).toBeTruthy();
    expect(signature.length).toBeGreaterThan(0);

    const signature2 = auth.generateSignature("GET", url, "fixed-nonce", "1700000000");
    expect(signature).toBe(signature2);
  });

  it("generates different signatures for different HTTP methods", async () => {
    const auth = new TBAAuth(testConfig);
    const url = "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123";

    const sigGet = auth.generateSignature("GET", url, "nonce1", "1700000000");
    const sigPost = auth.generateSignature("POST", url, "nonce1", "1700000000");

    expect(sigGet).not.toBe(sigPost);
  });

  it("generates different signatures for different URLs", async () => {
    const auth = new TBAAuth(testConfig);
    const url1 = "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123";
    const url2 = "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/456";

    const sig1 = auth.generateSignature("GET", url1, "nonce1", "1700000000");
    const sig2 = auth.generateSignature("GET", url2, "nonce1", "1700000000");

    expect(sig1).not.toBe(sig2);
  });

  it("each call to getAuthHeaders produces unique nonce", async () => {
    const auth = new TBAAuth(testConfig);
    const url = "https://1234567.suitetalk.api.netsuite.com/services/rest/record/v1/customer/123";

    const headers1 = await auth.getAuthHeaders("GET", url);
    const headers2 = await auth.getAuthHeaders("GET", url);

    const nonce1 = headers1.Authorization.match(/oauth_nonce="([^"]+)"/)?.[1];
    const nonce2 = headers2.Authorization.match(/oauth_nonce="([^"]+)"/)?.[1];

    expect(nonce1).not.toBe(nonce2);
  });
});
