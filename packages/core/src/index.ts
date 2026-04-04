// Auth
export type {
  AuthMethod,
  TBAConfig,
  NetSuiteConfig,
  AuthProvider,
} from "./auth/index.js";
export { TBAAuth } from "./auth/index.js";
export { loadConfig, saveConfig, listProfiles } from "./auth/index.js";
export { createAuthProvider } from "./auth/index.js";

// API
export { NetSuiteError } from "./api/index.js";
export type {
  SuiteQLResponse,
  RecordRef,
  RecordListResponse,
} from "./api/index.js";
export { NetSuiteClient } from "./api/index.js";
export type { GetRecordOptions, ListRecordsOptions } from "./api/index.js";
export { SuiteQLClient } from "./api/index.js";
export type { SuiteQLQueryOptions } from "./api/index.js";
