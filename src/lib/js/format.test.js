import { describe, expect, it } from "vitest";
import { extractQuant, formatModelName } from "./format.js";

describe("format helpers", () => {
  it("extracts quant labels from model ids", () => {
    expect(extractQuant("Llama-3.2-3B-Instruct-q4f16_1-MLC")).toBe("Fast F16");
  });

  it("formats model ids into readable labels", () => {
    expect(formatModelName("Llama-3.2-3B-Instruct-q4f16_1-MLC")).toBe(
      "Llama 3.2 3B Instruct - Fast F16",
    );
  });
});
