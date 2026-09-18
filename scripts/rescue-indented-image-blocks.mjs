/**
 * Squarespace-scraped posts keep nested-div indentation (often 14–18 spaces).
 * CommonMark treats a run of 4+-space lines as an indented code block, so
 * `![](https://…)`, bylines, and linked images land in <pre class="astro-code">.
 *
 * When an indented run contains markdown images, bylines, or link/image markup,
 * strip leading whitespace on every line in that run so it parses as markdown.
 * Copy text is unchanged; only scrape indentation is removed.
 */
export function rescueIndentedImageBlocks(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;

  const shouldRescue = (blockText) => {
    if (/!\[[^\]]*\]\([^)]+\)/.test(blockText)) return true;
    if (/Written By\s*\[/i.test(blockText)) return true;
    if (/\[[^\]]+\]\([^)]+\)/.test(blockText)) return true;
    if (/https?:\/\/images\.squarespace-cdn\.com/.test(blockText)) return true;
    // Caption/prose scrape dumps: indented plain sentences, not real code
    const trimmed = blockText.trim();
    if (
      trimmed.length > 40 &&
      !/[{};=`<>]|function\s|const\s|let\s|import\s|#!/.test(trimmed)
    ) {
      return true;
    }
    return false;
  };

  while (i < lines.length) {
    const line = lines[i];
    const isIndented = /^(?: {4}|\t)/.test(line) && line.trim() !== "";

    if (!isIndented) {
      out.push(line);
      i += 1;
      continue;
    }

    const block = [];
    let j = i;
    while (j < lines.length) {
      const cur = lines[j];
      if (cur.trim() === "") {
        let k = j + 1;
        while (k < lines.length && lines[k].trim() === "") k += 1;
        if (k < lines.length && /^(?: {4}|\t)/.test(lines[k])) {
          block.push(cur);
          j += 1;
          continue;
        }
        break;
      }
      if (/^(?: {4}|\t)/.test(cur)) {
        block.push(cur);
        j += 1;
        continue;
      }
      break;
    }

    const blockText = block.join("\n");
    if (shouldRescue(blockText)) {
      for (const blockLine of block) {
        out.push(blockLine.replace(/^[ \t]+/, ""));
      }
    } else {
      out.push(...block);
    }
    i = j;
  }

  return out.join("\n");
}

/** Fix wiki-style `[[Label]](url)` leftovers from the scrape. */
export function fixWikiStyleLinks(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]\(([^)]+)\)/g, "[$1]($2)");
}

/** Drop bare orphan `]` / `[` scrape crumbs on their own lines. */
export function stripOrphanBrackets(markdown) {
  return markdown
    .replace(/^[ \t]*\[[ \t]*$/gm, "")
    .replace(/^[ \t]*\]\([^)]+\)[ \t]*$/gm, "")
    .replace(/^[ \t]*\][ \t]*$/gm, "");
}

export function cleanScrapedMarkdown(markdown) {
  let out = rescueIndentedImageBlocks(markdown);
  out = fixWikiStyleLinks(out);
  out = stripOrphanBrackets(out);
  return out;
}
