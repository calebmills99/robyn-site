/**
 * Squarespace-scraped markdown often keeps nested-div indentation
 * (14–18 spaces). CommonMark treats that as an indented code block, so
 * images, bylines, and links land in <pre class="astro-code">.
 *
 * This remark plugin finds plaintext/indented code blocks that contain
 * markdown images, bylines, or links, strips leftover leading whitespace,
 * and re-parses the block as normal markdown.
 */
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";

const RESCUE_MARK =
  /!\[[^\]]*\]\([^)]+\)|Written By\s*\[|\[[^\]]+\]\([^)]+\)|squarespace-cdn\.com/i;

function looksLikeScrapeProse(value) {
  const trimmed = value.trim();
  return (
    trimmed.length > 40 &&
    !/[{};=`<>]|function\s|const\s|let\s|import\s|#!/.test(trimmed)
  );
}

function dedentScrapeIndent(value) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[ \t]+/, ""))
    .join("\n")
    .trim();
}

export function remarkRescueIndentedImages() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      // Indented scrape blocks have no lang; Astro may label them plaintext.
      if (node.lang && node.lang !== "plaintext") return;

      const value = node.value ?? "";
      if (!RESCUE_MARK.test(value) && !looksLikeScrapeProse(value)) return;

      const rescued = dedentScrapeIndent(value);
      if (!rescued) return;

      const fragment = fromMarkdown(rescued);
      if (!fragment.children?.length) return;

      parent.children.splice(index, 1, ...fragment.children);
      return index + fragment.children.length;
    });
  };
}
