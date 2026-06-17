import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(projectRoot, ".next");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
}

for (const port of [3000, 3001, 3002, 3003, 3004]) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const pids = new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid))
    );

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // No process on this port.
  }
}

console.log("Ready for npm run dev");
