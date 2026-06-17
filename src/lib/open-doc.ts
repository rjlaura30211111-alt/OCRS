import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { findTemplatePath } from "@/lib/project-paths";

function getOutputDir(): string {
  const projectRoot = path.dirname(path.dirname(findTemplatePath()));
  return path.join(projectRoot, ".output");
}

export function canAutoOpenWord(): boolean {
  return process.platform === "win32";
}

export async function saveAndOpenWord(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const outputDir = getOutputDir();
  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Brief pause so Windows finishes flushing the file before Word opens it.
  await new Promise((resolve) => setTimeout(resolve, 300));

  await new Promise<void>((resolve, reject) => {
    const child = spawn("cmd", ["/c", "start", "", filePath], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("exit", () => resolve());
    child.unref();
  });

  return filePath;
}
