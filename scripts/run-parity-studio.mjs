#!/usr/bin/env node
/**
 * Launch Astro dev with Parity Studio enabled.
 *
 * Usage:
 *   npm run parity
 *   CRAWL_ROOT="D:\\other\\crawl" npm run parity
 *
 * Default crawl (Caleb's machine):
 *   C:\RUNB2\crawls\collections\golden-wings-full
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_WIN = "C:\\RUNB2\\crawls\\collections\\golden-wings-full";
const DEFAULT_WSL = "/mnt/c/RUNB2/crawls/collections/golden-wings-full";

if (!process.env.CRAWL_ROOT) {
  process.env.CRAWL_ROOT =
    process.platform === "win32" ? DEFAULT_WIN : DEFAULT_WSL;
}

process.env.PARITY_STUDIO = "1";

const astroBin = path.join(
  ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "astro.cmd" : "astro",
);

const child = spawn(astroBin, ["dev", "--host", "127.0.0.1"], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
