#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repoRoot = findRepoRoot(appRoot);
const action = process.argv[2] || "build";

function fileExists(path) {
  return existsSync(path);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function readPackageJson(directory) {
  const packageJson = readJson(join(directory, "package.json"));
  return packageJson && typeof packageJson === "object" ? packageJson : null;
}

function findRepoRoot(startDirectory) {
  let current = startDirectory;

  while (true) {
    if (fileExists(join(current, "docs.json")) || fileExists(join(current, ".git"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return startDirectory;
    }

    current = parent;
  }
}

function packageManagerFromPackageJson(directory) {
  const packageJson = readPackageJson(directory);
  const packageManager = typeof packageJson?.packageManager === "string"
    ? packageJson.packageManager
    : "";

  if (packageManager.startsWith("bun@")) return "bun";
  if (packageManager.startsWith("pnpm@")) return "pnpm";
  if (packageManager.startsWith("yarn@")) return "yarn";
  if (packageManager.startsWith("npm@")) return "npm";
  return null;
}

function detectPackageManager(directory) {
  const declared = packageManagerFromPackageJson(directory);
  if (declared) return declared;

  if (fileExists(join(directory, "pnpm-lock.yaml"))) return "pnpm";
  if (fileExists(join(directory, "bun.lock")) || fileExists(join(directory, "bun.lockb"))) return "bun";
  if (fileExists(join(directory, "package-lock.json")) || fileExists(join(directory, "npm-shrinkwrap.json"))) return "npm";
  if (fileExists(join(directory, "yarn.lock"))) return "yarn";
  return "pnpm";
}

function hasPackageJson(directory) {
  return fileExists(join(directory, "package.json"));
}

function hasLockfile(directory, packageManager) {
  if (packageManager === "pnpm") return fileExists(join(directory, "pnpm-lock.yaml"));
  if (packageManager === "bun") return fileExists(join(directory, "bun.lock")) || fileExists(join(directory, "bun.lockb"));
  if (packageManager === "npm") return fileExists(join(directory, "package-lock.json")) || fileExists(join(directory, "npm-shrinkwrap.json"));
  if (packageManager === "yarn") return fileExists(join(directory, "yarn.lock"));
  return false;
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function enableCorepack() {
  spawnSync("corepack", ["enable"], { cwd: repoRoot, stdio: "ignore" });
}

function ensurePackageManager(packageManager) {
  if (packageManager === "pnpm" || packageManager === "yarn") {
    enableCorepack();
  }

  if (!commandExists(packageManager)) {
    throw new Error(
      "Docs Cloud detected " + packageManager + " but the command is not available in the Vercel build image.",
    );
  }
}

function run(command, args, cwd, options = {}) {
  console.log("[docs-cloud] " + command + " " + args.join(" ") + " (" + cwd + ")");
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      CI: process.env.CI || "1",
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (options.exitOnFailure === false) {
      return result.status || 1;
    }

    process.exit(result.status || 1);
  }

  return 0;
}

function installArgs(directory, packageManager) {
  const frozen = hasLockfile(directory, packageManager);

  if (packageManager === "pnpm") {
    return ["install", frozen ? "--frozen-lockfile" : "--no-frozen-lockfile"];
  }

  if (packageManager === "bun") {
    return frozen ? ["install", "--frozen-lockfile"] : ["install"];
  }

  if (packageManager === "npm") {
    return frozen ? ["ci"] : ["install"];
  }

  if (packageManager === "yarn") {
    const packageJson = readPackageJson(directory);
    const packageManagerValue = typeof packageJson?.packageManager === "string"
      ? packageJson.packageManager
      : "";
    const isModernYarn = /^yarn@[3-9]/.test(packageManagerValue) || fileExists(join(directory, ".yarnrc.yml"));
    return frozen
      ? ["install", isModernYarn ? "--immutable" : "--frozen-lockfile"]
      : ["install"];
  }

  return ["install"];
}

function relaxedInstallArgs(packageManager) {
  if (packageManager === "pnpm") return ["install", "--no-frozen-lockfile"];
  if (packageManager === "bun") return ["install"];
  if (packageManager === "npm") return ["install"];
  if (packageManager === "yarn") return ["install"];
  return ["install"];
}

function scriptArgs(packageManager, scriptName) {
  if (packageManager === "npm") return ["run", scriptName];
  if (packageManager === "yarn") return [scriptName];
  return ["run", scriptName];
}

function installProject(directory, label) {
  if (!hasPackageJson(directory)) {
    console.log("[docs-cloud] skipping " + label + " install; no package.json found");
    return;
  }

  const packageManager = detectPackageManager(directory);
  ensurePackageManager(packageManager);
  const args = installArgs(directory, packageManager);
  const status = run(packageManager, args, directory, { exitOnFailure: false });
  if (status === 0) {
    return;
  }

  const relaxedArgs = relaxedInstallArgs(packageManager);
  if (args.join(" ") !== relaxedArgs.join(" ")) {
    console.log("[docs-cloud] frozen install failed; retrying with " + relaxedArgs.join(" "));
    run(packageManager, relaxedArgs, directory);
    return;
  }

  process.exit(status);
}

function runProjectScript(directory, scriptName) {
  const packageJson = readPackageJson(directory);
  if (!packageJson?.scripts || typeof packageJson.scripts[scriptName] !== "string") {
    throw new Error("The docs app package.json does not define a " + scriptName + " script.");
  }

  const packageManager = detectPackageManager(directory);
  ensurePackageManager(packageManager);
  run(packageManager, scriptArgs(packageManager, scriptName), directory);
}

function install() {
  console.log("[docs-cloud] repo root: " + repoRoot);
  console.log("[docs-cloud] docs root: " + appRoot);

  installProject(repoRoot, "repository");

  if (repoRoot !== appRoot) {
    installProject(appRoot, "docs app");
  }
}

if (action === "install") {
  install();
} else if (action === "build" || action === "dev") {
  runProjectScript(appRoot, action);
} else {
  throw new Error("Unknown Docs Cloud Vercel action: " + action);
}
