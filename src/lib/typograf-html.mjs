import fs from "node:fs/promises";
import path from "node:path";
import Typograf from "typograf";
import {r} from "./_utils.mjs";

const tp = new Typograf({locale: ["ru", "en-US"]});
const HTML_DIRS = [r("src/markup"), r("@CMS")];

async function collectHtmlFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, {withFileTypes: true});
    const nested = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) return collectHtmlFiles(entryPath);
      if (entry.isFile() && entry.name.endsWith(".html")) return [entryPath];
      return [];
    }));

    return nested.flat();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function formatHtmlFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const formatted = tp.execute(source);

  if (formatted === source) return false;

  await fs.writeFile(filePath, formatted, "utf8");
  return true;
}

async function main() {
  const htmlFiles = (await Promise.all(HTML_DIRS.map(collectHtmlFiles))).flat();
  let updatedCount = 0;

  for (const filePath of htmlFiles) {
    const updated = await formatHtmlFile(filePath);
    if (!updated) continue;

    updatedCount += 1;
    console.log(`[typograf] updated ${path.relative(process.cwd(), filePath)}`);
  }

  console.log(`[typograf] done: ${updatedCount}/${htmlFiles.length} files updated`);
}

main().catch((error) => {
  console.error("[typograf] failed");
  console.error(error);
  process.exit(1);
});
