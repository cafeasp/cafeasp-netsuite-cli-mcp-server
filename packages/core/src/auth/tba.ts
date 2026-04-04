import { createHmac, randomBytes } from "node:crypto";
import type { AuthProvider, AuthMethod, TBAConfig } from "./types.js";

export class TBAAuth implements AuthProvider {
  private readonly config: TBAConfig;

  constructor(config: TBAConfig) {
    this.config = config;
  }

  getAuthMethod(): AuthMethod {
    return "tba";
  }

  async getAuthHeaders(method: string, url: string): Promise<Record<string, string>> {
    const nonce = randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(method, url, nonce, timestamp);

    const params = [
      `realm="${this.percentEncode(this.config.accountId)}"`,
      `oauth_consumer_key="${this.percentEncode(this.config.consumerKey)}"`,
      `oauth_nonce="${this.percentEncode(nonce)}"`,
      `oauth_signature="${this.percentEncode(signature)}"`,
      `oauth_signature_method="HMAC-SHA256"`,
      `oauth_timestamp="${timestamp}"`,
      `oauth_token="${this.percentEncode(this.config.tokenId)}"`,
      `oauth_version="1.0"`,
    ];

    return {
      Authorization: `OAuth ${params.join(", ")}`,
    };
  }

  generateSignature(method: string, url: string, nonce: string, timestamp: string): string {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

    const params: [string, string][] = [
      ["oauth_consumer_key", this.config.consumerKey],
      ["oauth_nonce", nonce],
      ["oauth_signature_method", "HMAC-SHA256"],
      ["oauth_timestamp", timestamp],
      ["oauth_token", this.config.tokenId],
      ["oauth_version", "1.0"],
    ];

    urlObj.searchParams.forEach((value, key) => {
      params.push([key, value]);
    });

    params.sort((a, b) => a[0].localeCompare(b[0]));

    const paramString = params
      .map(([k, v]) => `${this.percentEncode(k)}=${this.percentEncode(v)}`)
      .join("&");

    const signatureBase = [
      method.toUpperCase(),
      this.percentEncode(baseUrl),
      this.percentEncode(paramString),
    ].join("&");

    const signingKey = `${this.percentEncode(this.config.consumerSecret)}&${this.percentEncode(this.config.tokenSecret)}`;

    const hmac = createHmac("sha256", signingKey);
    hmac.update(signatureBase);
    return hmac.digest("base64");
  }

  private percentEncode(str: string): string {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
  }
}
