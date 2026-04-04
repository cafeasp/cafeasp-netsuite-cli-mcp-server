import {
  loadConfig,
  createAuthProvider,
  NetSuiteClient,
  SuiteQLClient,
} from "@cafeasp/netsuite-core";
import type { NetSuiteConfig } from "@cafeasp/netsuite-core";

export interface CLIClient {
  client: NetSuiteClient;
  suiteql: SuiteQLClient;
  config: NetSuiteConfig;
}

export function createCLIClient(profile?: string): CLIClient {
  const config = loadConfig({ profile });
  const auth = createAuthProvider(config);
  const client = new NetSuiteClient(auth, config.accountId);
  const suiteql = new SuiteQLClient(client);

  return { client, suiteql, config };
}
