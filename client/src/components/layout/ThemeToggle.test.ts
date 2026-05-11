import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(currentDir, "ThemeToggle.tsx"), "utf8");

assert.match(source, /text-white/);
assert.match(source, /border-white\/25/);
assert.match(source, /hover:bg-white\/10/);
