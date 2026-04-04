import { Command } from "commander";
import chalk from "chalk";
import { createSpinner } from "nanospinner";
import { createCLIClient } from "../client.js";
import { formatOutput, writeOutput } from "../utils/output.js";

export function createQueryCommand(parentOptions: () => {
  profile?: string;
  format?: string;
}): Command {
  const query = new Command("query")
    .description("Execute a SuiteQL query")
    .argument("<sql>", "SuiteQL query to execute")
    .option("-l, --limit <n>", "Maximum rows to return", parseInt)
    .option("-o, --offset <n>", "Starting row offset", parseInt)
    .option("-f, --format <type>", "Output format (table|json|csv)")
    .option("--output <file>", "Write results to file")
    .action(async (sql: string, opts) => {
      const globalOpts = parentOptions();
      const format = opts.format ?? globalOpts.format ?? "table";

      const spinner = createSpinner("Running query...").start();

      try {
        const { suiteql } = createCLIClient(globalOpts.profile);

        const result = await suiteql.query(sql, {
          limit: opts.limit,
          offset: opts.offset,
        });

        spinner.success({ text: `${result.items.length} row(s) returned` });

        if (result.items.length > 0) {
          const output = formatOutput(
            result.items as Record<string, unknown>[],
            format
          );
          writeOutput(output + "\n", opts.output);

          if (opts.output) {
            console.log(chalk.green(`Results written to ${opts.output}`));
          }
        }

        if (result.hasMore) {
          console.log(
            chalk.yellow(
              `\nMore results available. Use --limit and --offset to paginate.`
            )
          );
        }
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  return query;
}
