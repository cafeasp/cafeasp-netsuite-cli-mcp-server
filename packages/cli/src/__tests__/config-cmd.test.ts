import { describe, it, expect } from "vitest";
import { maskSecret } from "../commands/config.js";

describe("config command", () => {
  describe("maskSecret", () => {
    it("masks secret showing last 4 chars", () => {
      expect(maskSecret("abcdefghijklmnop")).toBe("************mnop");
    });

    it("masks short secrets entirely", () => {
      expect(maskSecret("abc")).toBe("***");
    });

    it("handles empty string", () => {
      expect(maskSecret("")).toBe("");
    });
  });
});
