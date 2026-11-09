export function cleanLegacyLinks(markdown) {
  return markdown
    .replace(/\[([^\]\n]*)\]\(\/indie-doc-journey\/(?:category|tag)\/[^\s)]*\)/g, "$1")
    .replace(/\[[^\]\n]*\]\(\/cdn-cgi\/l\/email-protection#([0-9a-f]+)\)/gi, (link, hex) => {
      if (hex.length < 4 || hex.length % 2 !== 0) return link;
      const bytes = Buffer.from(hex, "hex");
      const address = new TextDecoder("utf-8", { fatal: true });
      try {
        const email = address.decode(bytes.subarray(1).map((byte) => byte ^ bytes[0]));
        if (!/^[^\s<>()[\]]+@[^\s<>()[\]]+$/.test(email)) return link;
        return `[${email}](mailto:${email})`;
      } catch {
        return link;
      }
    });
}
