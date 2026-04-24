import { beforeEach, describe, expect, it, vi } from "vitest";

describe("recommendModel", () => {
  beforeEach(() => {
    vi.resetModules();

    const store = new Map();

    globalThis.localStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };

    globalThis.performance = {
      memory: {
        usedJSHeapSize: 0
      }
    };
  });

  it("returns the requested q weight when the machine can handle it", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 16,
      threads: 8,
      gpu: { tier: 2, gpu: "Test GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("Q4", "QFormat")).toBe("Q4");
  });

  it("normalizes q variants to their base q weight", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 16,
      threads: 8,
      gpu: { tier: 2, gpu: "Test GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("Q4F16_1", "QFormat")).toBe("Q4");
    expect(recommendModel("q4_k_m", "QFormat")).toBe("Q4");
    expect(recommendModel("Q3_K_S", "QFormat")).toBe("Q3");
    expect(recommendModel("Q4_k_m F32", "QFormat")).toBe("Q4");
  });

  it("returns the requested int weight when the machine can handle it", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 16,
      threads: 8,
      gpu: { tier: 2, gpu: "Test GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("INT4", "INTFormat")).toBe("INT4");
  });

  it("normalizes int and float variants to their base family weight", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 16,
      threads: 8,
      gpu: { tier: 2, gpu: "Test GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("int4", "INTFormat")).toBe("INT4");
    expect(recommendModel("4-bit", "INTFormat")).toBe("INT4");
    expect(recommendModel("bf16", "INTFormat")).toBe("INT4");
    expect(recommendModel("float16", "INTFormat")).toBe("INT4");
    expect(recommendModel("f32", "INTFormat")).toBe("INT4");
  });

  it("falls back to the recommended q weight when the requested one is too heavy", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 4,
      threads: 4,
      gpu: { tier: 0, gpu: "Tiny GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("Q8", "QFormat")).toBe("Q4");
  });

  it("falls back to the recommended int weight when the requested one is too heavy", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 4,
      threads: 4,
      gpu: { tier: 0, gpu: "Tiny GPU" }
    }));

    const { recommendModel } = await import("./recommendModels.js");

    expect(recommendModel("FP32", "INTFormat")).toBe("INT4");
  });
});

describe("model-name recommendation helpers", () => {
  beforeEach(() => {
    vi.resetModules();

    const store = new Map();

    globalThis.localStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };

    globalThis.performance = {
      memory: {
        usedJSHeapSize: 0
      }
    };
  });

  it("extracts quantization from full model names", async () => {
    const { extractModelQuantization } = await import("./recommendModels.js");

    expect(extractModelQuantization("Llama-3.2-3B-Instruct-q4_k_m F32")).toEqual({
      weight: "Q4",
      format: "QFormat"
    });

    expect(extractModelQuantization("Phi-3-mini-4k-instruct-bf16")).toEqual({
      weight: "BF16",
      format: "INTFormat"
    });
  });

  it("returns true when a model name is within the recommended ceiling", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 16,
      threads: 8,
      gpu: { tier: 2, gpu: "Test GPU" }
    }));

    const { isModelRecommended } = await import("./recommendModels.js");

    expect(isModelRecommended("Llama-3.2-3B-Instruct-q4_k_m F32")).toBe(true);
  });

  it("returns false when a model name is heavier than recommended", async () => {
    localStorage.setItem("systemSpecs", JSON.stringify({
      ram: 4,
      threads: 4,
      gpu: { tier: 0, gpu: "Tiny GPU" }
    }));

    const { isModelRecommended } = await import("./recommendModels.js");

    expect(isModelRecommended("Phi-3-mini-4k-instruct-bf16")).toBe(false);
    expect(isModelRecommended("No-quantization-info-here")).toBe(false);
  });
});
