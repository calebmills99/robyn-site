import assert from "node:assert/strict";
import test from "node:test";
import { cleanLegacyLinks } from "./clean-legacy-links.mjs";

test("unwraps taxonomy links without changing labels or other links", () => {
  assert.equal(
    cleanLegacyLinks("[Film & TV](/indie-doc-journey/category/Film+%26+TV)[#Film](/indie-doc-journey/tag/%23Film) [Journey](/indie-doc-journey)"),
    "Film & TV#Film [Journey](/indie-doc-journey)",
  );
});

test("decodes a Cloudflare email artifact", () => {
  assert.equal(
    cleanLegacyLinks("[email&#160;protected](/cdn-cgi/l/email-protection#660f0800092601090a0203084b110f0801154b1409041f084805090b)"),
    "[info@golden-wings-robyn.com](mailto:info@golden-wings-robyn.com)",
  );
});

test("leaves empty content and malformed email encodings unchanged", () => {
  for (const input of ["", "Plain text", "[email](/cdn-cgi/l/email-protection#0)", "[email](/cdn-cgi/l/email-protection#zz)", "[email](/cdn-cgi/l/email-protection#00ff)", "[email](/cdn-cgi/l/email-protection#006162)"]) {
    assert.equal(cleanLegacyLinks(input), input);
  }
});
