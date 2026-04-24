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

function parseList(lines, startIndex) {
  const items = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(/^\s*(?:[-*+]\s+(?:\[( |x|X)\]\s+)?|(\d+)\.\s+)(.*)$/);
    if (!match) break;

    const checkbox = match[1];
    const ordered = match[2];
    const content = match[3] ?? '';

    if (checkbox !== undefined) {
      items.push(
        `<li class="task-list-item"><input type="checkbox" disabled ${/x/i.test(checkbox) ? 'checked' : ''} /> <span>${parseInline(content)}</span></li>`
      );
    } else {
      items.push(`<li>${parseInline(content)}</li>`);
    }

    index += 1;
  }

  const tag = /^\s*\d+\.\s+/.test(lines[startIndex]) ? 'ol' : 'ul';
  return {
    nextIndex: index,
    html: `<${tag}>${items.join('')}</${tag}>`
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

export function markdownToHtml(markdown = "") {
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

  return blocks.join('');
}
