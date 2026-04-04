import { Command } from "commander";
import chalk from "chalk";
import readline from "node:readline/promises";
import { saveConfig, loadConfig, listProfiles } from "@cafeasp/netsuite-core";
import type { NetSuiteConfig } from "@cafeasp/netsuite-core";

export function maskSecret(value: string): string {
  if (value.length === 0) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return "*".repeat(value.length - 4) + value.slice(-4);
}

async function promptInput(
  rl: readline.Interface,
  question: string
): Promise<string> {
  const answer = await rl.question(question);
  return answer.trim();
}

export function createConfigCommand(parentOptions: () => { profile?: string }): Command {
  const config = new Command("config").description("Manage NetSuite configuration");

  config
    .command("init")
    .description("Interactive setup wizard")
    .action(async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
      });

      try {
        console.log(chalk.bold("\nNetSuite CLI Configuration\n"));

        const accountId = await promptInput(rl, "Account ID: ");
        const consumerKey = await promptInput(rl, "Consumer Key: ");
        const consumerSecret = await promptInput(rl, "Consumer Secret: ");
        const tokenId = await promptInput(rl, "Token ID: ");
        const tokenSecret = await promptInput(rl, "Token Secret: ");
        const profileName =
          (await promptInput(rl, 'Profile name (default: "default"): ')) ||
          "default";

        const netsuiteConfig: NetSuiteConfig = {
          authMethod: "tba",
          accountId,
          consumerKey,
          consumerSecret,
          tokenId,
          tokenSecret,
        };

        saveConfig(netsuiteConfig, { profile: profileName });

        console.log(
          chalk.green(`\n✔ Configuration saved to profile "${profileName}"`)
        );
      } finally {
        rl.close();
      }
    });

  config
    .command("show")
    .description("Display current configuration (secrets masked)")
    .action(() => {
      const opts = parentOptions();
      try {
        const cfg = loadConfig({ profile: opts.profile });
        console.log(chalk.bold("\nCurrent Configuration\n"));
        console.log(`  Profile:         ${opts.profile ?? "default"}`);
        console.log(`  Auth Method:     ${cfg.authMethod}`);
        console.log(`  Account ID:      ${cfg.accountId}`);

        if (cfg.authMethod === "tba") {
          console.log(`  Consumer Key:    ${maskSecret(cfg.consumerKey)}`);
          console.log(`  Consumer Secret: ${maskSecret(cfg.consumerSecret)}`);
          console.log(`  Token ID:        ${maskSecret(cfg.tokenId)}`);
          console.log(`  Token Secret:    ${maskSecret(cfg.tokenSecret)}`);
        }
        console.log();
      } catch (err) {
        console.error(
          chalk.red(
            `Error: ${err instanceof Error ? err.message : String(err)}`
          )
        );
        process.exitCode = 1;
      }
    });

  config
    .command("profiles")
    .description("List all saved profiles")
    .action(() => {
      const profiles = listProfiles();
      if (profiles.length === 0) {
        console.log("No profiles found. Run `netsuite config init` to create one.");
        return;
      }
      console.log(chalk.bold("\nSaved Profiles\n"));
      for (const name of profiles) {
        console.log(`  • ${name}`);
      }
      console.log();
    });

  return config;
}
