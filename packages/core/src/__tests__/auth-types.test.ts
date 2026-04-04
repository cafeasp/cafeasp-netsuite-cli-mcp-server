import { describe, it, expect } from "vitest";
import type { AuthMethod, TBAConfig, NetSuiteConfig, AuthProvider } from "../auth/types.js";

describe("auth types", () => {
  it("TBAConfig has all required fields", () => {
    const config: TBAConfig = {
      accountId: "1234567",
      consumerKey: "ck",
      consumerSecret: "cs",
      tokenId: "tid",
      tokenSecret: "ts",
    };
    expect(config.accountId).toBe("1234567");
    expect(config.consumerKey).toBe("ck");
    expect(config.consumerSecret).toBe("cs");
    expect(config.tokenId).toBe("tid");
    expect(config.tokenSecret).toBe("ts");
  });

  it("NetSuiteConfig discriminates on authMethod", () => {
    const tbaConfig: NetSuiteConfig = {
      authMethod: "tba",
      accountId: "1234567",
      consumerKey: "ck",
      consumerSecret: "cs",
      tokenId: "tid",
      tokenSecret: "ts",
    };
    expect(tbaConfig.authMethod).toBe("tba");
  });

  it("AuthMethod accepts valid values", () => {
    const method1: AuthMethod = "tba";
    const method2: AuthMethod = "oauth2_m2m";
    expect(method1).toBe("tba");
    expect(method2).toBe("oauth2_m2m");
  });

  it("AuthProvider interface shape is correct", () => {
    const mockProvider: AuthProvider = {
      getAuthHeaders: async () => ({
        Authorization: "test",
      }),
      getAuthMethod: () => "tba" as AuthMethod,
    };
    expect(mockProvider.getAuthMethod()).toBe("tba");
  });
});
