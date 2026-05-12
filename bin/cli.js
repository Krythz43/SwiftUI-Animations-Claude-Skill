#!/usr/bin/env node
"use strict";

/**
 * Installer for the `swiftui-animator` Claude Code skill.
 *
 *   npx swiftui-animator-skill            -> installs to ~/.claude/skills/swiftui-animator
 *   npx swiftui-animator-skill --project  -> installs to ./.claude/skills/swiftui-animator
 *   npx swiftui-animator-skill <dir>      -> installs to <dir>/swiftui-animator
 *   npx swiftui-animator-skill --print    -> prints the skill source directory and exits
 *
 * Flags: --force (overwrite an existing install), --help
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const SKILL_NAME = "swiftui-animator";
const SOURCE_DIR = path.join(__dirname, "..", "skills", SKILL_NAME);

function log(msg) {
  process.stdout.write(msg + "\n");
}

function fail(msg) {
  process.stderr.write("error: " + msg + "\n");
  process.exit(1);
}

function printHelp() {
  log(`swiftui-animator-skill — install the SwiftUI animation skill for Claude Code

Usage:
  npx swiftui-animator-skill [target] [options]

Targets:
  (default)        Install to ~/.claude/skills/${SKILL_NAME} (available in every project)
  --project, -p    Install to ./.claude/skills/${SKILL_NAME} (this project only)
  <dir>            Install to <dir>/${SKILL_NAME}

Options:
  --force, -f      Overwrite an existing install
  --print          Print the bundled skill's source directory and exit
  --help, -h       Show this help

After installing, open Claude Code in your Swift/SwiftUI project and ask it to
animate, polish, or "bring to life" a view — the skill triggers automatically.`);
}

function resolveTarget(args) {
  if (args.includes("--project") || args.includes("-p")) {
    return path.join(process.cwd(), ".claude", "skills", SKILL_NAME);
  }
  const positional = args.find((a) => !a.startsWith("-"));
  if (positional) {
    return path.join(path.resolve(positional), SKILL_NAME);
  }
  return path.join(os.homedir(), ".claude", "skills", SKILL_NAME);
}

// Only the runtime skill files — SKILL.md + references/. Anything else in the
// source tree (evals, fixtures) is dev/QA infrastructure and is not shipped.
function copySkill(dest, force) {
  if (fs.existsSync(dest)) {
    if (!force) {
      fail(`${dest} already exists. Re-run with --force to overwrite it.`);
    }
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(dest, "references"), { recursive: true });
  fs.copyFileSync(path.join(SOURCE_DIR, "SKILL.md"), path.join(dest, "SKILL.md"));
  for (const entry of fs.readdirSync(path.join(SOURCE_DIR, "references"))) {
    if (entry.endsWith(".md")) {
      fs.copyFileSync(
        path.join(SOURCE_DIR, "references", entry),
        path.join(dest, "references", entry)
      );
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (!fs.existsSync(path.join(SOURCE_DIR, "SKILL.md"))) {
    fail(`bundled skill not found at ${SOURCE_DIR} — the package may be corrupt.`);
  }

  if (args.includes("--print")) {
    log(SOURCE_DIR);
    return;
  }

  const force = args.includes("--force") || args.includes("-f");
  const dest = resolveTarget(args);

  copySkill(dest, force);

  log(`✓ Installed the "${SKILL_NAME}" skill to ${dest}`);
  log("");
  log("Next: open Claude Code in a SwiftUI project and try");
  log('  "polish this view" · "make this button feel alive" · "add a hero transition"');
}

main();
