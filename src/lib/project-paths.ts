import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const TEMPLATE_FILENAME = "document-template.docx";

export function findTemplatePath(): string {
  const searchRoots = new Set<string>([
    process.cwd(),
    path.join(process.cwd(), "Documents", "projects", "OCRS"),
  ]);

  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    searchRoots.add(dir);
    dir = path.dirname(dir);
  }

  for (const root of searchRoots) {
    const templatePath = path.join(root, "templates", TEMPLATE_FILENAME);
    if (fs.existsSync(templatePath)) {
      return templatePath;
    }
  }

  throw new Error(
    `Template not found at templates/${TEMPLATE_FILENAME}. ` +
      "Please place the routing slip Word file there."
  );
}

export function readTemplateBuffer(): Buffer {
  return fs.readFileSync(findTemplatePath());
}
