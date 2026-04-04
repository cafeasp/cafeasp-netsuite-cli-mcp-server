export type AuthMethod = "tba" | "oauth2_m2m";

export interface TBAConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export type NetSuiteConfig = {
  authMethod: "tba";
} & TBAConfig;

export interface AuthProvider {
  getAuthHeaders(method: string, url: string): Promise<Record<string, string>>;
  getAuthMethod(): AuthMethod;
}
