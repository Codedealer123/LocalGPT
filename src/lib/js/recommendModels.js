import { getGPUTier } from "@pmndrs/detect-gpu";

const FORMAT_CANDIDATES = {
  QFormat: ["Q8", "Q6", "Q5", "Q4", "Q3", "Q2", "Q1", "Q0"],
  INTFormat: ["FP32", "FP16", "BF16", "INT8", "INT4"]
};

const BYTES_PER_PARAM = {
  fp32: 4,
  fp16: 2,
  int8: 1,
  int4: 0.5
};

/**
 * @param {number} bytesPerParam
 * @param {number} effectiveRam
 */
export function maxParams(bytesPerParam, effectiveRam) {
  const totalBytes = effectiveRam * (1024 ** 3);
  return Math.floor(totalBytes / bytesPerParam);
}

export async function saveSpecs() {
  const ram = navigator.deviceMemory;
  const threads = navigator.hardwareConcurrency || 4;
  const gpu = await getGPUTier({ benchmarksURL: "/benchmarks" });

  const systemSpecs = { ram, threads, gpu };

  localStorage.setItem("systemSpecs", JSON.stringify(systemSpecs));
}

function getStoredSystemSpecs() {
  const rawSystemSpecs = localStorage.getItem("systemSpecs");

  if (!rawSystemSpecs) {
    return {
      ram: 4,
      threads: 4,
      gpu: {
        tier: 1,
        gpu: "Unknown GPU"
      }
    };
  }

  try {
    return JSON.parse(rawSystemSpecs);
  } catch {
    return {
      ram: 4,
      threads: 4,
      gpu: {
        tier: 1,
        gpu: "Unknown GPU"
      }
    };
  }
}

function getEffectiveRam(ram, gpuTier) {
  const usedRamBytes = performance?.memory?.usedJSHeapSize ?? 0;
  const usedRamGb = usedRamBytes / (1024 ** 3);
  const availableRam = Math.max((ram - usedRamGb) * 0.75, 0.5);

  let gpuMultiplier;
  switch (gpuTier) {
    case 0:
      gpuMultiplier = 0.5;
      break;
    case 1:
      gpuMultiplier = 0.75;
      break;
    case 2:
      gpuMultiplier = 1;
      break;
    case 3:
      gpuMultiplier = 1.5;
      break;
    default:
      gpuMultiplier = 1;
  }

  return availableRam * gpuMultiplier;
}

function recommendedModelWeights() {
  const systemSpecs = getStoredSystemSpecs();

  const threads = systemSpecs.threads ?? 4;
  const gpu = systemSpecs.gpu ?? { tier: 1, gpu: "Unknown GPU" };
  const gpuTier = gpu.tier ?? 1;
  const ram = systemSpecs.ram ?? 4;
  const effectiveRam = getEffectiveRam(ram, gpuTier);

  const capabilities = {
    fp32: maxParams(BYTES_PER_PARAM.fp32, effectiveRam),
    fp16: maxParams(BYTES_PER_PARAM.fp16, effectiveRam),
    int8: maxParams(BYTES_PER_PARAM.int8, effectiveRam),
    int4: maxParams(BYTES_PER_PARAM.int4, effectiveRam)
  };

  let recommended;

  if (capabilities.int4 >= 13e9) {
    recommended = { parameters: 13, maxQuantitization: "INT4", maxQuantitizationInQ: "Q4" };
  } else if (capabilities.int4 >= 7e9) {
    recommended = { parameters: 7, maxQuantitization: "INT4", maxQuantitizationInQ: "Q4" };
  } else if (capabilities.int8 >= 3e9) {
    recommended = { parameters: 3, maxQuantitization: "INT8", maxQuantitizationInQ: "Q8" };
  } else {
    recommended = { parameters: 1, maxQuantitization: "INT4", maxQuantitizationInQ: "Q4" };
  }

  return {
    ram,
    threads,
    gpu: gpu.gpu ?? "Unknown GPU",
    gpuTier,
    effectiveRam,
    maxParameters: capabilities,
    recommended
  };
}

function normalizeFormat(format) {
  const normalized = String(format ?? "").trim();

  if (normalized === "QFormat" || normalized === "INTFormat") {
    return normalized;
  }

  return null;
}

function extractQVariant(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "";

  const qMatch = normalized.match(/Q\s*([0-8])/);
  return qMatch ? `Q${qMatch[1]}` : "";
}

function extractIntVariant(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized) return "";

  if (normalized.includes("INT4") || normalized.includes("4-BIT") || normalized.includes("4BIT")) {
    return "INT4";
  }

  if (normalized.includes("INT8") || normalized.includes("8-BIT") || normalized.includes("8BIT")) {
    return "INT8";
  }

  if (normalized.includes("BF16") || normalized.includes("BFLOAT16")) {
    return "BF16";
  }

  if (normalized.includes("FP16") || normalized.includes("F16") || normalized.includes("FLOAT16") || normalized.includes("HALF")) {
    return "FP16";
  }

  if (normalized.includes("FP32") || normalized.includes("F32") || normalized.includes("FLOAT32") || normalized.includes("FULL")) {
    return "FP32";
  }

  return "";
}

function normalizeIntVariant(weight) {
  return extractIntVariant(weight) || String(weight ?? "").trim().toUpperCase();
}

function normalizeQVariant(weight) {
  return extractQVariant(weight) || String(weight ?? "").trim().toUpperCase();
}

function normalizeWeight(weight, format) {
  if (format === "QFormat") {
    return normalizeQVariant(weight);
  }

  if (format === "INTFormat") {
    return normalizeIntVariant(weight);
  }

  return String(weight ?? "").trim().toUpperCase();
}

function getRequestedOrder(weight, format) {
  const candidates = FORMAT_CANDIDATES[format];
  const normalizedWeight = normalizeWeight(weight, format);
  const requestedIndex = candidates.indexOf(normalizedWeight);

  if (requestedIndex === -1) {
    return candidates;
  }

  return candidates.slice(requestedIndex);
}

function getFamilyMaxWeight(format, recommended) {
  if (format === "QFormat") {
    return normalizeWeight(recommended.maxQuantitizationInQ, format);
  }

  return normalizeWeight(recommended.maxQuantitization, format);
}

/**
 * @param {string} modelName
 * @returns {{ weight: string, format: "QFormat" | "INTFormat" } | null}
 */
export function extractModelQuantization(modelName) {
  const qWeight = extractQVariant(modelName);
  if (qWeight) {
    return {
      weight: qWeight,
      format: "QFormat"
    };
  }

  const intWeight = extractIntVariant(modelName);
  if (intWeight) {
    return {
      weight: intWeight,
      format: "INTFormat"
    };
  }

  return null;
}

/**
 * Returns the best weight at or below the requested format family.
 * Variant examples:
 * recommendModel("Q4F16_1", "QFormat") -> "Q4"
 * recommendModel("Q4_K_M", "QFormat") -> "Q4"
 * recommendModel("bf16", "INTFormat") -> "BF16"
 * recommendModel("int4", "INTFormat") -> "INT4"
 *
 * @param {string} weight
 * @param {"QFormat" | "INTFormat"} format
 */
export function recommendModel(weight, format) {
  const normalizedFormat = normalizeFormat(format);
  if (!normalizedFormat) {
    return null;
  }

  const { recommended } = recommendedModelWeights();
  const requestedWeights = getRequestedOrder(weight, normalizedFormat);
  const familyCandidates = FORMAT_CANDIDATES[normalizedFormat];
  const familyMaxWeight = getFamilyMaxWeight(normalizedFormat, recommended);
  const familyMaxIndex = familyCandidates.indexOf(familyMaxWeight);

  for (const candidate of requestedWeights) {
    const candidateIndex = familyCandidates.indexOf(candidate);

    if (candidateIndex >= familyMaxIndex) {
      return candidate;
    }
  }

  return familyMaxWeight;
}

/**
 * Returns true when the model name's extracted quantization is within the
 * recommended ceiling for the current machine.
 *
 * @param {string} modelName
 */
export function isModelRecommended(modelName) {
  const extracted = extractModelQuantization(modelName);
  if (!extracted) {
    return false;
  }

  return recommendModel(extracted.weight, extracted.format) === extracted.weight;
}
