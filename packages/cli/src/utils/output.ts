import chalk from "chalk";
import fs from "node:fs";

export function formatJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const lines: string[] = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      const str = val == null ? "" : String(val);
      // Quote values containing commas or double quotes
      if (str.includes(",") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n") + "\n";
}

export function formatTable(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "No results.";

  const headers = Object.keys(data[0]);

  // Calculate column widths
  const widths = headers.map((h) => {
    const maxDataWidth = Math.max(
      ...data.map((row) => {
        const val = row[h];
        return val == null ? 0 : String(val).length;
      })
    );
    return Math.max(h.length, maxDataWidth);
  });

  // Build header row
  const headerRow = headers
    .map((h, i) => chalk.bold(h.padEnd(widths[i])))
    .join("  ");

  // Build separator
  const separator = widths.map((w) => "─".repeat(w)).join("──");

  // Build data rows
  const rows = data.map((row) =>
    headers
      .map((h, i) => {
        const val = row[h];
        const str = val == null ? "" : String(val);
        return str.padEnd(widths[i]);
      })
      .join("  ")
  );

  return [headerRow, separator, ...rows].join("\n");
}

export function writeOutput(content: string, filePath?: string): void {
  if (filePath) {
    fs.writeFileSync(filePath, content);
  } else {
    process.stdout.write(content);
  }
}

export function formatOutput(
  data: Record<string, unknown>[],
  format: string
): string {
  switch (format) {
    case "json":
      return formatJSON(data);
    case "csv":
      return formatCSV(data);
    case "table":
    default:
      return formatTable(data);
  }
}
