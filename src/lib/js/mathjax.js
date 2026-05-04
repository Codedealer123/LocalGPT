// MathJax config MUST be set before MathJax loads.
// Static `import` is hoisted above all module code, so we use a dynamic
// import() instead — this runs synchronously here first, then MathJax loads.
if (typeof window !== "undefined") {
  window.MathJax = {
    tex: {
      inlineMath:  [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
      tags: "none",
    },
    startup: {
      ready() {
        window.MathJax.startup.defaultReady();
        mathjaxReady = true;
        mathjaxQueue.forEach((fn) => fn());
        mathjaxQueue = [];
      },
    },
  };
}

// Dynamic import so MathJax loads AFTER the config above is set.
// With a static `import "mathjax/..."` at the top of the file, the import
// is hoisted and MathJax would load before window.MathJax is assigned.
let mathjaxReady = false;
let mathjaxQueue = [];

if (typeof window !== "undefined") {
  import("mathjax/es5/tex-chtml.js").catch((e) =>
    console.warn("MathJax failed to load:", e)
  );
}

// ---------------------------------------------------------------------------

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeUrl(url = "") {
  const value = String(url).trim();
  return /^(https?:|mailto:|#|\/)/i.test(value) ? value : "#";
}

const NUMBERED_ENVS = {
  'equation': 'equation*',
  'align':    'align*',
  'alignat':  'alignat*',
  'gather':   'gather*',
  'multline': 'multline*',
  'flalign':  'flalign*',
  'eqnarray': 'eqnarray*',
};

function normalizeMath(text) {
  // \begin{env}...\end{env} -> \[...\]
  text = text.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (_, env, body) => {
    const envName = env.trim();
    const renderEnv = NUMBERED_ENVS[envName] ?? envName;
    return `\\[\\begin{${renderEnv}}${body}\\end{${renderEnv}}\\]`;
  });

  // $$...$$ -> \[...\]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, body) => `\\[${body}\\]`);

  // $...$ -> \(...\)
  text = text.replace(/\$([^\$\n]+?)\$/g, (_, body) => `\\(${body}\\)`);

  // Collapse multi-line \[...\] and \(...\) onto a single line so the
  // line-by-line markdown parser sees them as one unit.
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => `\\[${body.replace(/\n/g, ' ')}\\]`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => `\\(${body.replace(/\n/g, ' ')}\\)`);

  return text;
}

function parseInline(text = "") {
  const codeTokens = [];

  // Protect math from bold/italic regexes using a sentinel without _ or *.
  const mathPlaceholders = [];
  text = text.replace(/\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g, (m) => {
    const id = `XMATHX${mathPlaceholders.length}XMATHX`;
    mathPlaceholders.push(m);
    return id;
  });

  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `__CODE_${codeTokens.length}__`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    return `<img src="${sanitizeUrl(src)}" alt="${escapeHtml(alt)}" />`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    return `<a href="${sanitizeUrl(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  });

  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");
  html = html.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
  html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");
  html = html.replace(/==(.+?)==/g, "<mark>$1</mark>");
  html = html.replace(/\^([^^\n]+)\^/g, "<sup>$1</sup>");
  html = html.replace(/~([^~\n]+)~/g, "<sub>$1</sub>");
  html = html.replace(/ {2}\n/g, "<br />");
  html = html.replace(/\n/g, "<br />");

  html = codeTokens.reduce(
    (result, token, index) => result.replace(`__CODE_${index}__`, token),
    html
  );

  html = mathPlaceholders.reduce(
    (result, original, i) => result.replace(`XMATHX${i}XMATHX`, original),
    html
  );

  return html;
}

function getListItemMeta(line = "") {
  const match = line.match(
    /^(\s*)(?:([-*+])\s+(?:\[( |x|X)\]\s+)?|(\d+)\.\s+)(.*)$/,
  );
  if (!match) return null;

  const indent = match[1]?.length ?? 0;
  const checkbox = match[3];
  const orderedStart = match[4];
  const content = match[5] ?? "";

  return {
    indent,
    checkbox,
    orderedStart,
    content,
    kind: checkbox !== undefined ? "task" : orderedStart ? "ordered" : "unordered",
  };
}

function parseList(lines, startIndex) {
  const firstItem = getListItemMeta(lines[startIndex]);
  if (!firstItem) return null;

  const items = [];
  let index = startIndex;
  const listKind = firstItem.kind;
  const baseIndent = firstItem.indent;
  const start = firstItem.orderedStart ? Number(firstItem.orderedStart) : 1;

  while (index < lines.length) {
    const item = getListItemMeta(lines[index]);
    if (!item || item.indent !== baseIndent || item.kind !== listKind) break;

    if (item.kind === "task") {
      items.push(
        `<li class="task-list-item"><input type="checkbox" disabled ${/x/i.test(item.checkbox) ? "checked" : ""} /> <span>${parseInline(item.content)}</span></li>`,
      );
    } else {
      items.push(`<li>${parseInline(item.content)}</li>`);
    }

    index += 1;

    while (index < lines.length) {
      const continuation = lines[index];
      if (!continuation.trim()) break;

      const continuationItem = getListItemMeta(continuation);
      const continuationIndent = continuation.match(/^(\s*)/)?.[1]?.length ?? 0;

      if (continuationItem || continuationIndent <= baseIndent) break;

      const previous = items.pop() ?? "";
      items.push(
        previous.replace("</li>", `<br />${parseInline(continuation.trim())}</li>`),
      );
      index += 1;
    }
  }

  const tag = listKind === "ordered" ? "ol" : "ul";
  const startAttr = tag === "ol" && start > 1 ? ` start="${start}"` : "";
  const classAttr = listKind === "task" ? ' class="task-list"' : "";

  return {
    nextIndex: index,
    html: `<${tag}${startAttr}${classAttr}>${items.join("")}</${tag}>`,
  };
}

function parseTable(lines, startIndex) {
  if (startIndex + 1 >= lines.length) return null;
  if (
    !/\|/.test(lines[startIndex]) ||
    !/^\s*\|?[\s:-|]+\|?\s*$/.test(lines[startIndex + 1])
  ) {
    return null;
  }

  const rows = [];
  let index = startIndex;

  while (
    index < lines.length &&
    /\|/.test(lines[index]) &&
    lines[index].trim() !== ""
  ) {
    rows.push(lines[index]);
    index += 1;
  }

  const splitRow = (line) =>
    line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  const header = splitRow(rows[0]);
  const body = rows.slice(2).map(splitRow);

  return {
    nextIndex: index,
    html:
      `<table><thead><tr>${header.map((c) => `<th>${parseInline(c)}</th>`).join("")}</tr></thead>` +
      `<tbody>${body.map((row) => `<tr>${row.map((c) => `<td>${parseInline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
  };
}

function extractThinkBlock(markdown) {
  const closed = markdown.match(/^<think>([\s\S]*?)<\/think>\n*/);
  if (closed) {
    return { think: closed[1].trim(), rest: markdown.slice(closed[0].length), open: false };
  }
  const open = markdown.match(/^<think>([\s\S]*)/);
  if (open) {
    return { think: open[1].trim(), rest: "", open: true };
  }
  return { think: null, rest: markdown, open: false };
}

export function typeset(element) {
  if (!element) return;
  const run = async () => {
    if (!window.MathJax?.typesetPromise) return;
    await window.MathJax.typesetClear([element]);
    await window.MathJax.typesetPromise([element]);
  };
  if (mathjaxReady) run();
  else mathjaxQueue.push(run);
}

export function mathjaxToHtml(markdown = "", appendHtml = "") {
  const { think, rest, open } = extractThinkBlock(
    String(markdown).replace(/\r\n/g, "\n"),
  );

  const source = normalizeMath(rest);
  const lines = source.split("\n");
  const blocks = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    // Standalone display math line
    if (/^\\\[[\s\S]*?\\\]$/.test(trimmed)) {
      blocks.push(`<div class="math-block">${trimmed}</div>`);
      index += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const language = trimmed.slice(3).trim();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    const table = parseTable(lines, index);
    if (table) {
      blocks.push(table.html);
      index = table.nextIndex;
      continue;
    }

    if (/^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/.test(line)) {
      const list = parseList(lines, index);
      if (!list) { index += 1; continue; }
      blocks.push(list.html);
      index = list.nextIndex;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        `<blockquote>${quoteLines.map((q) => `<p>${parseInline(q)}</p>`).join("")}</blockquote>`,
      );
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const [, hashes, content] = trimmed.match(/^(#{1,6})\s+(.*)$/);
      const level = hashes.length;
      blocks.push(`<h${level}>${parseInline(content)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      blocks.push("<hr />");
      index += 1;
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^```/.test(lines[index].trim()) &&
      !/^>\s?/.test(lines[index].trim()) &&
      !/^#{1,6}\s+/.test(lines[index].trim()) &&
      !/^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/.test(lines[index]) &&
      !(
        /\|/.test(lines[index]) &&
        index + 1 < lines.length &&
        /^\s*\|?[\s:-|]+\|?\s*$/.test(lines[index + 1])
      )
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push(`<p>${parseInline(paragraph.join("\n"))}</p>`);
  }

  const body = blocks.join("");

  if (!appendHtml) {
    const thinkHtml = think
      ? `<details class="think-block" ${open ? "open" : ""}><summary>${open ? "Thinking\u2026" : "Thinking"}</summary><div class="think-body">${mathjaxToHtml(think)}</div></details>`
      : "";
    return thinkHtml + body;
  }

  if (blocks.length === 0) return `<p>${appendHtml}</p>`;

  const last = blocks[blocks.length - 1];
  const closing = last.match(/<\/([a-z][a-z0-9]*)>$/i);
  let result;
  if (closing) {
    blocks[blocks.length - 1] = last.slice(0, -closing[0].length) + appendHtml + closing[0];
    result = blocks.join("");
  } else {
    result = body + appendHtml;
  }

  const thinkHtml = think
    ? `<details class="think-block" ${open ? "open" : ""}><summary>${open ? "Thinking\u2026" : "Thinking"}</summary><div class="think-body">${mathjaxToHtml(think)}</div></details>`
    : "";

  return thinkHtml + result;
}

export function userMarkdownToHtml(text = "") {
  let html = escapeHtml(String(text));
  // inline code — protect first so inner content isn't touched by other regexes
  const codeTokens = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `__UCODE_${codeTokens.length}__`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  html = html.replace(/\n/g, '<br />');
  html = codeTokens.reduce((r, tok, i) => r.replace(`__UCODE_${i}__`, tok), html);
  return html;
}
