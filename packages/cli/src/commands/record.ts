import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs";
import readline from "node:readline/promises";
import { createSpinner } from "nanospinner";
import { createCLIClient } from "../client.js";
import { formatOutput, writeOutput } from "../utils/output.js";

function parseDataInput(data?: string, file?: string): unknown {
  if (file) {
    const content = fs.readFileSync(file, "utf-8");
    return JSON.parse(content);
  }
  if (data) {
    return JSON.parse(data);
  }
  throw new Error("Provide --data <json> or --file <path>");
}

export function createRecordCommand(parentOptions: () => {
  profile?: string;
  format?: string;
}): Command {
  const record = new Command("record").description(
    "CRUD operations on NetSuite records"
  );

  record
    .command("get")
    .description("Fetch a record by type and ID")
    .argument("<type>", "Record type (e.g., customer, item)")
    .argument("<id>", "Internal ID")
    .option("--fields <fields>", "Comma-separated field list")
    .option("-f, --format <type>", "Output format (table|json|csv)")
    .action(async (type: string, id: string, opts) => {
      const globalOpts = parentOptions();
      const format = opts.format ?? globalOpts.format ?? "json";

      const spinner = createSpinner(`Fetching ${type} ${id}...`).start();

      try {
        const { client } = createCLIClient(globalOpts.profile);
        const result = await client.getRecord(type, id, {
          fields: opts.fields?.split(","),
        });

        spinner.success({ text: `${type} ${id} retrieved` });

        const data = Array.isArray(result) ? result : [result];
        const output = formatOutput(
          data as Record<string, unknown>[],
          format
        );
        writeOutput(output + "\n");
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  record
    .command("list")
    .description("List records of a given type")
    .argument("<type>", "Record type")
    .option("-l, --limit <n>", "Maximum records", parseInt)
    .option("-o, --offset <n>", "Starting offset", parseInt)
    .option("-q, --query <filter>", "Filter expression")
    .option("--fields <fields>", "Comma-separated field list")
    .option("-f, --format <type>", "Output format (table|json|csv)")
    .action(async (type: string, opts) => {
      const globalOpts = parentOptions();
      const format = opts.format ?? globalOpts.format ?? "table";

      const spinner = createSpinner(`Listing ${type} records...`).start();

      try {
        const { client } = createCLIClient(globalOpts.profile);
        const result = (await client.listRecords(type, {
          limit: opts.limit,
          offset: opts.offset,
          q: opts.query,
          fields: opts.fields?.split(","),
        })) as { items?: Record<string, unknown>[] };

        const items = result.items ?? [];
        spinner.success({ text: `${items.length} record(s) returned` });

        if (items.length > 0) {
          const output = formatOutput(items, format);
          writeOutput(output + "\n");
        }
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  record
    .command("create")
    .description("Create a new record")
    .argument("<type>", "Record type")
    .option("-d, --data <json>", "Record data as JSON")
    .option("--file <path>", "Read record data from JSON file")
    .action(async (type: string, opts) => {
      const globalOpts = parentOptions();
      const spinner = createSpinner(`Creating ${type}...`).start();

      try {
        const body = parseDataInput(opts.data, opts.file);
        const { client } = createCLIClient(globalOpts.profile);
        const result = await client.createRecord(type, body);

        spinner.success({ text: `${type} created` });
        console.log(formatOutput([result] as Record<string, unknown>[], "json"));
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  record
    .command("update")
    .description("Update an existing record")
    .argument("<type>", "Record type")
    .argument("<id>", "Internal ID")
    .option("-d, --data <json>", "Record data as JSON")
    .option("--file <path>", "Read record data from JSON file")
    .action(async (type: string, id: string, opts) => {
      const globalOpts = parentOptions();
      const spinner = createSpinner(`Updating ${type} ${id}...`).start();

      try {
        const body = parseDataInput(opts.data, opts.file);
        const { client } = createCLIClient(globalOpts.profile);
        await client.updateRecord(type, id, body);

        spinner.success({ text: `${type} ${id} updated` });
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  record
    .command("delete")
    .description("Delete a record")
    .argument("<type>", "Record type")
    .argument("<id>", "Internal ID")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (type: string, id: string, opts) => {
      const globalOpts = parentOptions();

      if (!opts.yes) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stderr,
        });
        const answer = await rl.question(
          chalk.yellow(`Delete ${type} ${id}? This cannot be undone. (y/N) `)
        );
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log("Cancelled.");
          return;
        }
      }

      const spinner = createSpinner(`Deleting ${type} ${id}...`).start();

      try {
        const { client } = createCLIClient(globalOpts.profile);
        await client.deleteRecord(type, id);
        spinner.success({ text: `${type} ${id} deleted` });
      } catch (err) {
        spinner.error({
          text: err instanceof Error ? err.message : String(err),
        });
        process.exitCode = 1;
      }
    });

  return record;
}
