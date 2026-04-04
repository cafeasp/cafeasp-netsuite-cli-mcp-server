export interface SuiteQLResponse {
  items: Record<string, unknown>[];
  links: { rel: string; href: string }[];
  totalResults: number;
  count: number;
  hasMore: boolean;
  offset: number;
}

export interface RecordRef {
  id: string;
  links: { rel: string; href: string }[];
}

export interface RecordListResponse {
  items: RecordRef[];
  links: { rel: string; href: string }[];
  totalResults: number;
  count: number;
  hasMore: boolean;
  offset: number;
}

export interface NetSuiteErrorOptions {
  statusCode: number;
  errorCode: string;
  body: unknown;
}

export class NetSuiteError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly body: unknown;

  constructor(message: string, options: NetSuiteErrorOptions) {
    super(message);
    this.name = "NetSuiteError";
    this.statusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.body = options.body;
  }

  static fromResponse(statusCode: number, body: Record<string, unknown>): NetSuiteError {
    const details = body["o:errorDetails"] as
      | Array<{ "o:errorCode"?: string; detail?: string }>
      | undefined;

    if (details && details.length > 0) {
      const first = details[0];
      return new NetSuiteError(first.detail ?? `NetSuite API error (HTTP ${statusCode})`, {
        statusCode,
        errorCode: first["o:errorCode"] ?? "UNKNOWN",
        body,
      });
    }

    return new NetSuiteError(`NetSuite API error (HTTP ${statusCode})`, {
      statusCode,
      errorCode: "UNKNOWN",
      body,
    });
  }
}
