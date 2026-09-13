/**
 * Squarespace-scraped posts keep nested-div indentation (often 14–18 spaces).
 * CommonMark treats a run of 4+-space lines as an indented code block, so
 * `![](https://…)` never becomes <img> — it lands in <pre class="astro-code">.
 *
 * When an indented run contains markdown image syntax, strip leading whitespace
 * on every line in that run so images (and nearby captions) parse as markdown.
 * Copy text is unchanged; only scrape indentation is removed.
 */
export function rescueIndentedImageBlocks(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;

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
    if (/!\[[^\]]*\]\([^)]+\)/.test(blockText)) {
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
