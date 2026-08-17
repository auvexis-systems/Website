// Minimal, dependency-free Mustache-like template engine.
// Supports: {{var}} (escaped), {{{var}}} (raw), {{#each list}}...{{/each}},
// {{#if cond}}...{{else}}...{{/if}}, dotted paths, and "this" inside #each.
// Intentionally small and readable — this is a build-time tool only, never
// shipped to the browser.

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolvePath(context, path) {
  if (path === "this" || path === ".") return context;
  const parts = path.split(".");
  let value = context;
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  return value;
}

// Splits the template into top-level tokens, respecting nested block tags
// of the same type so {{#each}} / {{#if}} blocks can be nested.
function findMatchingClose(src, openTag, closeTag, startIndex) {
  let depth = 1;
  let i = startIndex;
  while (i < src.length) {
    const nextOpen = src.indexOf(openTag, i);
    const nextClose = src.indexOf(closeTag, i);
    if (nextClose === -1) throw new Error(`Unclosed block for ${openTag}`);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + openTag.length;
    } else {
      depth -= 1;
      if (depth === 0) return nextClose;
      i = nextClose + closeTag.length;
    }
  }
  throw new Error(`Unclosed block for ${openTag}`);
}

export function render(template, context) {
  let output = "";
  let cursor = 0;
  const tagRegex = /\{\{\{?[^}]+\}?\}\}/g;

  while (cursor < template.length) {
    tagRegex.lastIndex = cursor;
    const match = tagRegex.exec(template);
    if (!match) {
      output += template.slice(cursor);
      break;
    }

    output += template.slice(cursor, match.index);
    const raw = match[0];

    if (raw.startsWith("{{#each ")) {
      const path = raw.slice(8, -2).trim();
      const openTag = "{{#each " + path + "}}";
      const closeTag = "{{/each}}";
      const bodyStart = match.index + raw.length;
      const closeIndex = findMatchingClose(template, "{{#each", closeTag, bodyStart);
      const body = template.slice(bodyStart, closeIndex);
      const list = resolvePath(context, path) || [];
      for (const item of list) {
        output += render(body, item);
      }
      cursor = closeIndex + closeTag.length;
      continue;
    }

    if (raw.startsWith("{{#if ")) {
      const path = raw.slice(6, -2).trim();
      const closeTag = "{{/if}}";
      const bodyStart = match.index + raw.length;
      const closeIndex = findMatchingClose(template, "{{#if", closeTag, bodyStart);
      const fullBody = template.slice(bodyStart, closeIndex);
      const elseIndex = fullBody.indexOf("{{else}}");
      const truthy = Boolean(resolvePath(context, path));
      const branch = elseIndex === -1
        ? (truthy ? fullBody : "")
        : (truthy ? fullBody.slice(0, elseIndex) : fullBody.slice(elseIndex + 8));
      output += render(branch, context);
      cursor = closeIndex + closeTag.length;
      continue;
    }

    if (raw.startsWith("{{{")) {
      const path = raw.slice(3, -3).trim();
      output += resolvePath(context, path) ?? "";
      cursor = match.index + raw.length;
      continue;
    }

    const path = raw.slice(2, -2).trim();
    output += escapeHtml(resolvePath(context, path));
    cursor = match.index + raw.length;
  }

  return output;
}
