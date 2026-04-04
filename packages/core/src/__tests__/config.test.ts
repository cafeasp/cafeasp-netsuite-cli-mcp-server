import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadConfig, saveConfig, listProfiles } from "../auth/config.js";

describe("config", () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "netsuite-test-"));
    // Clear all NETSUITE_ env vars
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NETSUITE_")) delete process.env[key];
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    // Restore env
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NETSUITE_")) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
  });

  it("loads config from file with default profile", () => {
    const configData = {
      profiles: {
        default: {
          authMethod: "tba",
          accountId: "1234567",
          consumerKey: "ck",
          consumerSecret: "cs",
          tokenId: "tid",
          tokenSecret: "ts",
        },
      },
    };
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(configData));

    const config = loadConfig({ configPath });
    expect(config.authMethod).toBe("tba");
    expect(config.accountId).toBe("1234567");
    expect(config.consumerKey).toBe("ck");
  });

  it("loads config from named profile", () => {
    const configData = {
      profiles: {
        default: {
          authMethod: "tba",
          accountId: "1234567",
          consumerKey: "ck-default",
          consumerSecret: "cs",
          tokenId: "tid",
          tokenSecret: "ts",
        },
        sandbox: {
          authMethod: "tba",
          accountId: "1234567-sb1",
          consumerKey: "ck-sandbox",
          consumerSecret: "cs-sb",
          tokenId: "tid-sb",
          tokenSecret: "ts-sb",
        },
      },
    };
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(configData));

    const config = loadConfig({ configPath, profile: "sandbox" });
    expect(config.accountId).toBe("1234567-sb1");
    expect(config.consumerKey).toBe("ck-sandbox");
  });

  it("env vars override file values", () => {
    const configData = {
      profiles: {
        default: {
          authMethod: "tba",
          accountId: "from-file",
          consumerKey: "ck",
          consumerSecret: "cs",
          tokenId: "tid",
          tokenSecret: "ts",
        },
      },
    };
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(configData));

    process.env.NETSUITE_ACCOUNT_ID = "from-env";
    process.env.NETSUITE_CONSUMER_KEY = "ck-env";

    const config = loadConfig({ configPath });
    expect(config.accountId).toBe("from-env");
    expect(config.consumerKey).toBe("ck-env");
    // Non-overridden values come from file
    expect(config.consumerSecret).toBe("cs");
  });

  it("loads config from env vars only (no file)", () => {
    process.env.NETSUITE_ACCOUNT_ID = "env-account";
    process.env.NETSUITE_CONSUMER_KEY = "env-ck";
    process.env.NETSUITE_CONSUMER_SECRET = "env-cs";
    process.env.NETSUITE_TOKEN_ID = "env-tid";
    process.env.NETSUITE_TOKEN_SECRET = "env-ts";

    const config = loadConfig({ configPath: path.join(tmpDir, "nonexistent.json") });
    expect(config.authMethod).toBe("tba");
    expect(config.accountId).toBe("env-account");
    expect(config.consumerKey).toBe("env-ck");
  });

  it("throws when no config found", () => {
    expect(() =>
      loadConfig({ configPath: path.join(tmpDir, "nonexistent.json") })
    ).toThrow();
  });

  it("throws when profile does not exist", () => {
    const configData = {
      profiles: {
        default: {
          authMethod: "tba",
          accountId: "1234567",
          consumerKey: "ck",
          consumerSecret: "cs",
          tokenId: "tid",
          tokenSecret: "ts",
        },
      },
    };
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(configData));

    expect(() =>
      loadConfig({ configPath, profile: "nonexistent" })
    ).toThrow('Profile "nonexistent" not found');
  });

  it("saves config to file", () => {
    const configDir = path.join(tmpDir, ".netsuite");
    const configPath = path.join(configDir, "config.json");

    saveConfig(
      {
        authMethod: "tba",
        accountId: "1234567",
        consumerKey: "ck",
        consumerSecret: "cs",
        tokenId: "tid",
        tokenSecret: "ts",
      },
      { configPath }
    );

    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(raw.profiles.default.accountId).toBe("1234567");
  });

  it("saves config to named profile without overwriting others", () => {
    const configDir = path.join(tmpDir, ".netsuite");
    const configPath = path.join(configDir, "config.json");

    saveConfig(
      {
        authMethod: "tba",
        accountId: "prod-123",
        consumerKey: "ck1",
        consumerSecret: "cs1",
        tokenId: "tid1",
        tokenSecret: "ts1",
      },
      { configPath }
    );

    saveConfig(
      {
        authMethod: "tba",
        accountId: "sb-123",
        consumerKey: "ck2",
        consumerSecret: "cs2",
        tokenId: "tid2",
        tokenSecret: "ts2",
      },
      { configPath, profile: "sandbox" }
    );

    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(raw.profiles.default.accountId).toBe("prod-123");
    expect(raw.profiles.sandbox.accountId).toBe("sb-123");
  });

  it("lists profiles", () => {
    const configData = {
      profiles: {
        default: { authMethod: "tba", accountId: "1" },
        sandbox: { authMethod: "tba", accountId: "2" },
        production: { authMethod: "tba", accountId: "3" },
      },
    };
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(configData));

    const profiles = listProfiles({ configPath });
    expect(profiles).toEqual(["default", "sandbox", "production"]);
  });

  it("returns empty array when no config file exists", () => {
    const profiles = listProfiles({
      configPath: path.join(tmpDir, "nonexistent.json"),
    });
    expect(profiles).toEqual([]);
  });
});
