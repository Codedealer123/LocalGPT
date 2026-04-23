const quantLabels = {
  '2': 'Very Light',
  '3': 'Light',
  '4': 'Fast',
  '5': 'Balanced',
  '6': 'High Quality',
  '7': 'Very High Quality',
  '8': 'Max Quality',
  '9': 'Extreme'
};

const formatLabels = {
  F32: 'Full Precision',
  F16: 'Half Precision',
  BF16: 'BF16',
  INT8: '8-bit',
  INT4: '4-bit'
};

/**
 * @param {string} id
 */
export function extractQuant(id) {
  if (!id) return null;

  const qMatch = id.match(/q(\d+)(?:[_\-]?f?(\d+))?/i);
  const fMatch = id.match(/\b(bf16|f16|f32|int8|int4)\b/i);

  const parts = [];

  if (qMatch) {
    const q = qMatch[1];
    const label = quantLabels[q] ?? `Q${q}`;
    parts.push(label);

    if (qMatch[2]) {
      parts.push(`F${qMatch[2]}`);
    }
  }

  if (fMatch) {
    const f = fMatch[1].toUpperCase();
    if (!parts.includes(formatLabels[f])) {
      parts.push(formatLabels[f] ?? f);
    }
  }

  return parts.length ? parts.join(" ") : null;
}

/**
 * @param {string} id
 */
export function formatModelName(id) {
  if (!id) return "";

  const quant = extractQuant(id);

  const name = id
    .replace(/q\d+(?:[_\-]?f?\d+)?/gi, "")
    .replace(/\b(bf16|f16|f32|int8|int4)\b/gi, "")
    .replace(/-?MLC/gi, "")
    .replace(/2512\s*_1/gi, "")
    .replace(/(?:^|[_-])\d+(?=$|[_-])/g, " ")
    .replace(/\b1k\b/gi, "")
    .replace(/vram\s*\d+(\.\d+)?(gb)?/gi, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const clean = name || id;

  return quant ? `${clean} - ${quant}` : clean;
}
/**
 * @param {string} id
 */
export function getModelHint(id) {
  if (!id) return "";

  const lower = id.toLowerCase();

  if (lower.includes("q2") || lower.includes("int4")) {
    return "Very low compute, lowest quality.";
  }

  if (lower.includes("q3") || lower.includes("q4") || lower.includes("int8")) {
    return "Lower compute, faster responses.";
  }

  if (lower.includes("q5") || lower.includes("q6")) {
    return "Moderate compute and quality.";
  }

  if (lower.includes("q7") || lower.includes("q8")) {
    return "High compute, higher quality.";
  }

  if (lower.includes("f32")) {
    return "Full precision, extremely heavy.";
  }

  if (lower.includes("f16") || lower.includes("bf16")) {
    return "Higher precision, heavier workload.";
  }

  return "";
}
