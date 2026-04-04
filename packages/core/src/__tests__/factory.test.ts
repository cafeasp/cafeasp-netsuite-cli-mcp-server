import { describe, it, expect } from "vitest";
import { createAuthProvider } from "../auth/factory.js";
import { TBAAuth } from "../auth/tba.js";
import type { NetSuiteConfig } from "../auth/types.js";

describe("createAuthProvider", () => {
  it("returns TBAAuth for tba authMethod", () => {
    const config: NetSuiteConfig = {
      authMethod: "tba",
      accountId: "1234567",
      consumerKey: "ck",
      consumerSecret: "cs",
      tokenId: "tid",
      tokenSecret: "ts",
    };

    const provider = createAuthProvider(config);
    expect(provider).toBeInstanceOf(TBAAuth);
    expect(provider.getAuthMethod()).toBe("tba");
  });

  it("throws for unsupported auth method", () => {
    const config = {
      authMethod: "oauth2_m2m",
      accountId: "1234567",
    } as NetSuiteConfig;

    expect(() => createAuthProvider(config)).toThrow(
      'Unsupported auth method: "oauth2_m2m"'
    );
  });
});
