import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { NetSuiteConfig } from "./types.js";

interface ConfigFileData {
  profiles: Record<string, Record<string, string>>;
}

interface LoadConfigOptions {
  configPath?: string;
  profile?: string;
}

interface SaveConfigOptions {
  configPath?: string;
  profile?: string;
}

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), ".netsuite");
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, "config.json");

function readConfigFile(configPath: string): ConfigFileData | null {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as ConfigFileData;
  } catch {
    return null;
  }
}

function getEnvOverrides(): Partial<Record<string, string>> {
  const overrides: Partial<Record<string, string>> = {};

  if (process.env.NETSUITE_ACCOUNT_ID) overrides.accountId = process.env.NETSUITE_ACCOUNT_ID;
  if (process.env.NETSUITE_AUTH_METHOD) overrides.authMethod = process.env.NETSUITE_AUTH_METHOD;
  if (process.env.NETSUITE_CONSUMER_KEY) overrides.consumerKey = process.env.NETSUITE_CONSUMER_KEY;
  if (process.env.NETSUITE_CONSUMER_SECRET) overrides.consumerSecret = process.env.NETSUITE_CONSUMER_SECRET;
  if (process.env.NETSUITE_TOKEN_ID) overrides.tokenId = process.env.NETSUITE_TOKEN_ID;
  if (process.env.NETSUITE_TOKEN_SECRET) overrides.tokenSecret = process.env.NETSUITE_TOKEN_SECRET;

  return overrides;
}

export function loadConfig(options: LoadConfigOptions = {}): NetSuiteConfig {
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  const profile = options.profile ?? "default";

  const fileData = readConfigFile(configPath);
  const envOverrides = getEnvOverrides();

  let profileData: Record<string, string> = {};

  if (fileData) {
    if (!fileData.profiles[profile]) {
      throw new Error(`Profile "${profile}" not found in ${configPath}`);
    }
    profileData = { ...fileData.profiles[profile] };
  }

  // Env vars override file values
  const merged = { ...profileData, ...envOverrides };

  // Default authMethod to "tba"
  if (!merged.authMethod) {
    merged.authMethod = "tba";
  }

  // Validate required fields for TBA
  if (merged.authMethod === "tba") {
    const required = ["accountId", "consumerKey", "consumerSecret", "tokenId", "tokenSecret"];
    const missing = required.filter((key) => !merged[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required TBA config fields: ${missing.join(", ")}. ` +
        `Set via ~/.netsuite/config.json or environment variables.`
      );
    }
  }

  return merged as unknown as NetSuiteConfig;
}

export function saveConfig(
  config: NetSuiteConfig,
  options: SaveConfigOptions = {}
): void {
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  const profile = options.profile ?? "default";
  const configDir = path.dirname(configPath);

  // Create config directory if needed
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }

  // Read existing file or create new structure
  let fileData: ConfigFileData = { profiles: {} };
  const existing = readConfigFile(configPath);
  if (existing) {
    fileData = existing;
  }

  // Save profile
  fileData.profiles[profile] = { ...config };

  // Write file with restrictive permissions
  fs.writeFileSync(configPath, JSON.stringify(fileData, null, 2), {
    mode: 0o600,
  });
}

export function listProfiles(options: { configPath?: string } = {}): string[] {
  const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
  const fileData = readConfigFile(configPath);
  if (!fileData) return [];
  return Object.keys(fileData.profiles);
}
