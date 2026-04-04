import type { AuthProvider, NetSuiteConfig } from "./types.js";
import { TBAAuth } from "./tba.js";

export function createAuthProvider(config: NetSuiteConfig): AuthProvider {
  switch (config.authMethod) {
    case "tba":
      return new TBAAuth(config);
    default:
      throw new Error(
        `Unsupported auth method: "${(config as { authMethod: string }).authMethod}". ` +
          `Only "tba" is currently supported.`
      );
  }
}
