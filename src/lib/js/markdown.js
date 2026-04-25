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
  return /^(https?:|mailto:|#|\/)/i.test(value) ? value : '#';
}

function parseInline(text = "") {
  const codeTokens = [];
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

  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
  html = html.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');
  html = html.replace(/\^([^^\n]+)\^/g, '<sup>$1</sup>');
  html = html.replace(/~([^~\n]+)~/g, '<sub>$1</sub>');
  html = html.replace(/ {2}\n/g, '<br />');
  html = html.replace(/\n/g, '<br />');

  return codeTokens.reduce(
    (result, token, index) => result.replace(`__CODE_${index}__`, token),
    html
  );
}

function getListItemMeta(line = "") {
  const match = line.match(/^(\s*)(?:([-*+])\s+(?:\[( |x|X)\]\s+)?|(\d+)\.\s+)(.*)$/);
  if (!match) return null;

  const indent = match[1]?.length ?? 0;
  const checkbox = match[3];
  const orderedStart = match[4];
  const content = match[5] ?? '';

  return {
    indent,
    checkbox,
    orderedStart,
    content,
    kind: checkbox !== undefined ? 'task' : orderedStart ? 'ordered' : 'unordered',
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

    if (item.kind === 'task') {
      items.push(
        `<li class="task-list-item"><input type="checkbox" disabled ${/x/i.test(item.checkbox) ? 'checked' : ''} /> <span>${parseInline(item.content)}</span></li>`
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

      const previous = items.pop() ?? '';
      items.push(previous.replace('</li>', `<br />${parseInline(continuation.trim())}</li>`));
      index += 1;
    }
  }

  const tag = listKind === 'ordered' ? 'ol' : 'ul';
  const startAttr = tag === 'ol' && start > 1 ? ` start="${start}"` : '';
  const classAttr = listKind === 'task' ? ' class="task-list"' : '';

  return {
    nextIndex: index,
    html: `<${tag}${startAttr}${classAttr}>${items.join('')}</${tag}>`
  };
}

function parseTable(lines, startIndex) {
  if (startIndex + 1 >= lines.length) return null;
  if (!/\|/.test(lines[startIndex]) || !/^\s*\|?[\s:-|]+\|?\s*$/.test(lines[startIndex + 1])) {
    return null;
  }

  const rows = [];
  let index = startIndex;

  while (index < lines.length && /\|/.test(lines[index]) && lines[index].trim() !== '') {
    rows.push(lines[index]);
    index += 1;
  }

  const splitRow = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const header = splitRow(rows[0]);
  const body = rows.slice(2).map(splitRow);

  return {
    nextIndex: index,
    html:
      `<table><thead><tr>${header.map((cell) => `<th>${parseInline(cell)}</th>`).join('')}</tr></thead>` +
      `<tbody>${body
        .map((row) => `<tr>${row.map((cell) => `<td>${parseInline(cell)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
  };
}

export function markdownToHtml(markdown = "", appendHtml = "") {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
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
      blocks.push(`<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
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
      if (!list) {
        index += 1;
        continue;
      }
      blocks.push(list.html);
      index = list.nextIndex;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(`<blockquote>${quoteLines.map((quote) => `<p>${parseInline(quote)}</p>`).join('')}</blockquote>`);
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
      blocks.push('<hr />');
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
      !(/\|/.test(lines[index]) && index + 1 < lines.length && /^\s*\|?[\s:-|]+\|?\s*$/.test(lines[index + 1]))
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push(`<p>${parseInline(paragraph.join('\n'))}</p>`);
  }

  if (!appendHtml) return blocks.join('');

  if (blocks.length === 0) return `<p>${appendHtml}</p>`;

  const last = blocks[blocks.length - 1];
  const closing = last.match(/<\/([a-z][a-z0-9]*)>$/i);
  if (closing) {
    blocks[blocks.length - 1] = last.slice(0, -closing[0].length) + appendHtml + closing[0];
  } else {
    blocks[blocks.length - 1] = last + appendHtml;
  }

  return blocks.join('');
}