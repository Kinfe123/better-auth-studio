import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = resolve(runtimeRoot, "../..");
const authoredRoots = [
  { source: resolve(repoRoot, "docs"), target: resolve(runtimeRoot, "app/docs") },
  { source: resolve(repoRoot, "api-reference"), target: resolve(runtimeRoot, "app/docs/api") },
];
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".vercel",
  "dist",
  "build",
  "coverage",
]);
const ignoredFileNames = new Set([
  "bun.lock",
  "jsconfig.json",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "yarn.lock",
]);
const staticAssetExtensions = new Set([
  ".avif",
  ".bmp",
  ".csv",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".json",
  ".mp4",
  ".pdf",
  ".png",
  ".svg",
  ".txt",
  ".webm",
  ".webp",
  ".zip",
]);
const codeFenceLanguageAliases = new Map([
  ["dotenv", "bash"],
  ["env", "bash"],
  ["shell", "bash"],
]);

function isMarkdownFile(path) {
  return [".md", ".mdx"].includes(extname(path).toLowerCase());
}

function isStaticAssetFile(path) {
  return staticAssetExtensions.has(extname(path).toLowerCase());
}

function shouldSkipDirectory(name) {
  return name.startsWith(".") || ignoredDirectoryNames.has(name);
}

function shouldSkipFile(name) {
  return name.startsWith(".") || ignoredFileNames.has(name);
}

function normalizeMarkdownContent(content) {
  const fenceMarker = String.fromCharCode(96);
  const codeFencePattern = new RegExp(
    "(^|\\n)(" + fenceMarker + "{3,})([A-Za-z0-9_+.-]+)([^\\n" + fenceMarker + "]*)",
    "g",
  );

  return content.replace(codeFencePattern, (match, prefix, fence, language, rest = "") => {
    const normalizedLanguage = codeFenceLanguageAliases.get(language.toLowerCase());

    if (!normalizedLanguage) {
      return match;
    }

    return prefix + fence + normalizedLanguage + rest;
  });
}

function targetPagePath(targetRoot, relativePath) {
  const withoutExtension = relativePath.replace(/\.mdx?$/i, "");
  const routeFileName = basename(withoutExtension).toLowerCase();
  const isIndexPage = routeFileName === "index" || routeFileName === "page";
  const targetDirectory = isIndexPage ? dirname(withoutExtension) : withoutExtension;
  return join(targetRoot, targetDirectory === "." ? "" : targetDirectory, "page.mdx");
}

async function fileExists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    try {
      await readFile(path, "utf8");
      return true;
    } catch {
      return false;
    }
  }
}

async function syncAuthoredRoot(sourceRoot, targetRoot) {
  if (!(await fileExists(sourceRoot))) {
    return;
  }

  const visit = async (currentSourceDirectory, relativeDirectory = "") => {
    const entries = await readdir(currentSourceDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const sourcePath = join(currentSourceDirectory, entry.name);
      const relativePath = relativeDirectory ? join(relativeDirectory, entry.name) : entry.name;

      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name)) {
          continue;
        }

        await visit(sourcePath, relativePath);
        continue;
      }

      if (!isMarkdownFile(entry.name)) {
        if (shouldSkipFile(entry.name) || !isStaticAssetFile(entry.name)) {
          continue;
        }

        const targetPath = join(targetRoot, relativePath);
        await mkdir(dirname(targetPath), { recursive: true });
        await cp(sourcePath, targetPath, { force: true });
        continue;
      }

      const targetPath = targetPagePath(targetRoot, relativePath);
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, normalizeMarkdownContent(await readFile(sourcePath, "utf8")), "utf8");
    }
  };

  await visit(sourceRoot);
}

await rm(resolve(runtimeRoot, "app/docs"), { recursive: true, force: true });
await mkdir(resolve(runtimeRoot, "app/docs"), { recursive: true });

for (const authoredRoot of authoredRoots) {
  await syncAuthoredRoot(authoredRoot.source, authoredRoot.target);
}
