import { Command } from "commander";
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { createCLIClient } from "../client.js";

export function createInfoCommand(parentOptions: () => {
  profile?: string;
}): Command {
  const info = new Command("info")
    .description("Test connectivity and display account info")
    .action(async () => {
      const globalOpts = parentOptions();
      const spinner = createSpinner("Testing connection...").start();

      try {
        const { suiteql, config } = createCLIClient(globalOpts.profile);

        const result = await suiteql.query(
          "SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS servertime FROM dual"
        );

        const serverTime =
          result.items.length > 0
            ? String(result.items[0].servertime)
            : "unknown";

        spinner.success({ text: "Connected" });

        console.log(chalk.bold("\nNetSuite Connection Info\n"));
        console.log(`  Profile:      ${globalOpts.profile ?? "default"}`);
        console.log(`  Account ID:   ${config.accountId}`);
        console.log(`  Auth Method:  ${config.authMethod}`);
        console.log(`  Server Time:  ${serverTime}`);
        console.log();
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  return info;
}
