import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

const services = [
  spawn(process.execPath, [npmCli, "--prefix", "apps/web", "run", "dev"], {
    cwd: root,
    stdio: "inherit",
  }),
  spawn(process.execPath, ["scripts/python-runner.mjs", "-m", "uvicorn", "app.main:app", "--app-dir", "apps/api", "--reload", "--port", "8001"], {
    cwd: root,
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function stop(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const service of services) service.kill();
  process.exit(code);
}

for (const service of services) {
  service.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  service.on("exit", (code) => {
    if (!shuttingDown && code) stop(code);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
