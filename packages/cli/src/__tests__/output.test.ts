import { describe, it, expect } from "vitest";
import { formatTable, formatJSON, formatCSV } from "../utils/output.js";

const sampleData = [
  { id: "1", companyname: "Acme Corp", email: "info@acme.com" },
  { id: "2", companyname: "Globex", email: "hello@globex.com" },
  { id: "3", companyname: "Initech", email: null },
];

describe("formatJSON", () => {
  it("returns pretty-printed JSON", () => {
    const result = formatJSON(sampleData);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sampleData);
    expect(result).toContain("\n"); // pretty-printed, not one line
  });

  it("handles empty array", () => {
    const result = formatJSON([]);
    expect(JSON.parse(result)).toEqual([]);
  });
});

describe("formatCSV", () => {
  it("produces header row and data rows", () => {
    const result = formatCSV(sampleData);
    const lines = result.trim().split("\n");
    expect(lines[0]).toBe("id,companyname,email");
    expect(lines[1]).toBe("1,Acme Corp,info@acme.com");
    expect(lines[2]).toBe("2,Globex,hello@globex.com");
  });

  it("handles null values as empty string", () => {
    const result = formatCSV(sampleData);
    const lines = result.trim().split("\n");
    expect(lines[3]).toBe("3,Initech,");
  });

  it("quotes values containing commas", () => {
    const data = [{ name: "Smith, John", age: "30" }];
    const result = formatCSV(data);
    const lines = result.trim().split("\n");
    expect(lines[1]).toBe('"Smith, John",30');
  });

  it("returns empty string for empty array", () => {
    const result = formatCSV([]);
    expect(result).toBe("");
  });
});

describe("formatTable", () => {
  it("produces aligned columns with headers", () => {
    const result = formatTable(sampleData);
    const lines = result.trim().split("\n");
    // Should have header + separator + 3 data rows
    expect(lines.length).toBe(5);
    // Header should contain column names
    expect(lines[0]).toContain("id");
    expect(lines[0]).toContain("companyname");
    expect(lines[0]).toContain("email");
  });

  it("handles empty array", () => {
    const result = formatTable([]);
    expect(result).toBe("No results.");
  });

  it("handles null values", () => {
    const result = formatTable(sampleData);
    expect(result).toContain("Initech");
  });
});
