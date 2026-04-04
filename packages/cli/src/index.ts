import { Command } from "commander";
import { createConfigCommand } from "./commands/config.js";
import { createQueryCommand } from "./commands/query.js";
import { createRecordCommand } from "./commands/record.js";
import { createInfoCommand } from "./commands/info.js";

const program = new Command();

program
  .name("netsuite")
  .description("NetSuite CLI — query, browse, and manage NetSuite from the terminal")
  .version("0.1.0")
  .option("-p, --profile <name>", "Configuration profile to use")
  .option("-f, --format <type>", "Default output format (table|json|csv)");

const getGlobalOpts = () => program.opts<{ profile?: string; format?: string }>();

program.addCommand(createConfigCommand(getGlobalOpts));
program.addCommand(createQueryCommand(getGlobalOpts));
program.addCommand(createRecordCommand(getGlobalOpts));
program.addCommand(createInfoCommand(getGlobalOpts));

program.parse();
