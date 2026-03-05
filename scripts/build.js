#!/usr/bin/env node
/**
 * build.js
 *
 * Assembles README.md from the source files:
 *   src/header.yml       — LiaScript YAML header fields
 *   src/macros/*.md      — individual macro definitions
 *   src/js/quiz-logic.js — shared pure-logic functions inlined into each macro
 *   src/body.md          — documentation body
 *
 * Output: README.md in the repository root
 *
 * Macro order is determined by the MACRO_ORDER constant below.
 * The quiz-logic functions are injected into macro scripts via the
 * {{QUIZ_LOGIC}} placeholder.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

/** Ordered list of macro file names (without .md extension). */
const MACRO_ORDER = [
  "dragdroporder",
  "dragdropmultiple",
  "dragdropmultipleimages",
  "dragdropsort",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Reads src/js/quiz-logic.js and strips the CommonJS export block at the
 * bottom so the resulting snippet is pure browser JavaScript.
 */
function readQuizLogic() {
  const raw = read(path.join(SRC, "js", "quiz-logic.js"));
  // Remove the module.exports block (the last `if (typeof module …)` block)
  return raw.replace(/\nif \(typeof module[\s\S]*$/, "").trimEnd();
}

/**
 * Builds a single macro block:
 *   @macroName
 *   <content with {{QUIZ_LOGIC}} substituted>
 *   @end
 */
function buildMacroBlock(macroName, quizLogic) {
  const macroPath = path.join(SRC, "macros", `${macroName}.md`);
  let content = read(macroPath);
  content = content.replace(/\{\{QUIZ_LOGIC\}\}/g, quizLogic);
  return `@${macroName}\n${content}\n@end`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const header = read(path.join(SRC, "header.yml")).trimEnd();
const quizLogic = readQuizLogic();
const body = read(path.join(SRC, "body.md")).trimEnd();

const macroBlocks = MACRO_ORDER.map((name) =>
  buildMacroBlock(name, quizLogic)
).join("\n\n");

const readme = `<!--\n${header}\n\n${macroBlocks}\n-->\n\n${body}\n`;

const outputPath = path.join(ROOT, "README.md");
fs.writeFileSync(outputPath, readme, "utf8");

console.log(`README.md written to ${outputPath}`);
