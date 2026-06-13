import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const bundledPython = path.join(
  homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  process.platform === "win32" ? "python.exe" : "bin/python",
);

const python = process.env.PYTHON || (existsSync(bundledPython) ? bundledPython : process.platform === "win32" ? "python" : "python3");
const apiPath = path.join(process.cwd(), "apps", "api");
const pythonPath = [apiPath, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);
const child = spawn(python, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, PYTHONPATH: pythonPath },
});

child.on("error", (error) => {
  console.error(`Unable to start Python (${python}): ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
