import { describe, it, expect } from "vitest";
import { NetSuiteError } from "../api/types.js";

describe("NetSuiteError", () => {
  it("extends Error with statusCode and errorCode", () => {
    const error = new NetSuiteError("Record not found", {
      statusCode: 404,
      errorCode: "RCRD_DSNT_EXIST",
      body: { "o:errorDetails": [{ detail: "Record not found" }] },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Record not found");
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe("RCRD_DSNT_EXIST");
    expect(error.body).toEqual({
      "o:errorDetails": [{ detail: "Record not found" }],
    });
    expect(error.name).toBe("NetSuiteError");
  });

  it("creates from API response body", () => {
    const responseBody = {
      "o:errorDetails": [
        {
          "o:errorCode": "INVALID_SEARCH",
          detail: "An error occurred in a search",
        },
      ],
    };

    const error = NetSuiteError.fromResponse(400, responseBody);
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("INVALID_SEARCH");
    expect(error.message).toBe("An error occurred in a search");
  });

  it("handles response with no error details", () => {
    const error = NetSuiteError.fromResponse(500, {});
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe("UNKNOWN");
    expect(error.message).toBe("NetSuite API error (HTTP 500)");
  });
});
