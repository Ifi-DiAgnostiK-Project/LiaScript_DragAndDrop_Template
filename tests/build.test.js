"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const README_PATH = path.join(ROOT, "README.md");

describe("build script", () => {
  let readmeContent;

  beforeAll(() => {
    // Run the build script and read the output
    execSync("node scripts/build.js", { cwd: ROOT });
    readmeContent = fs.readFileSync(README_PATH, "utf8");
  });

  test("README.md starts with a LiaScript HTML comment block", () => {
    expect(readmeContent.startsWith("<!--")).toBe(true);
  });

  test("README.md contains the YAML header fields", () => {
    expect(readmeContent).toContain("author:");
    expect(readmeContent).toContain("title: Drag and Drop Quizzes");
    expect(readmeContent).toContain("script:");
  });

  test("README.md contains all four macro definitions", () => {
    expect(readmeContent).toContain("@dragdroporder");
    expect(readmeContent).toContain("@dragdropmultiple");
    expect(readmeContent).toContain("@dragdropmultipleimages");
    expect(readmeContent).toContain("@dragdropsort");
  });

  test("each macro definition is properly terminated with @end", () => {
    const macros = ["dragdroporder", "dragdropmultiple", "dragdropmultipleimages", "dragdropsort"];
    macros.forEach((name) => {
      const startIdx = readmeContent.indexOf(`@${name}\n`);
      expect(startIdx).toBeGreaterThan(-1);
      const endIdx = readmeContent.indexOf("@end", startIdx);
      expect(endIdx).toBeGreaterThan(startIdx);
    });
  });

  test("README.md closes the header comment before the body", () => {
    const closeComment = readmeContent.indexOf("-->");
    const firstHeading = readmeContent.indexOf("# Drag and Drop Quizzes");
    expect(closeComment).toBeGreaterThan(-1);
    expect(firstHeading).toBeGreaterThan(closeComment);
  });

  test("README.md inlines the quiz logic functions into macros", () => {
    expect(readmeContent).toContain("function getOrderHints(");
    expect(readmeContent).toContain("function isOrderCorrect(");
    expect(readmeContent).toContain("function isMultipleChoiceCorrect(");
    expect(readmeContent).toContain("function isSortCorrect(");
    expect(readmeContent).toContain("function isValidHttpUrl(");
  });

  test("README.md contains the body documentation sections", () => {
    expect(readmeContent).toContain("## Order quiz");
    expect(readmeContent).toContain("## Multiple choice quiz");
    expect(readmeContent).toContain("## Sorting Quiz");
  });

  test("README.md contains a link to the developer guide", () => {
    expect(readmeContent).toContain("docs/development.md");
  });

  test("dragdroporder macro supports new API (correct-only) and legacy API with deprecation warning", () => {
    const startIdx = readmeContent.indexOf("@dragdroporder\n");
    const endIdx = readmeContent.indexOf("@end", startIdx);
    const macro = readmeContent.slice(startIdx, endIdx);
    // New API detection
    expect(macro).toContain("'@2'.includes('|')");
    // In-page red deprecation warning element
    expect(macro).toContain('class="deprecation-warning"');
    expect(macro).toContain("deprecationWarning.style.display = 'block'");
    // Console deprecation warning for legacy API
    expect(macro).toContain("console.warn(");
    expect(macro).toContain("Deprecated API");
    // Legacy API still reads @3 for randomize and @4 for maxTrials
    expect(macro).toContain("'@3' === 'true'");
    expect(macro).toContain("parseInt('@4') || 0");
    // New API reads @2 for maxTrials and @3 for glueNeighbors
    expect(macro).toContain("parseInt('@2') || 0");
    expect(macro).toContain("'@3' !== 'false'");
    // Shared behaviour
    expect(macro).toContain("lockQuizFailed(");
    expect(macro).toContain("maxTrials > 0 && savedData.tries >= maxTrials");
    // Order hints wiring — hints shown only after button click, not on drag
    expect(macro).toContain("function updateHints(");
    expect(macro).not.toContain("onEnd: updateHints");
    expect(macro).toContain("getOrderHints(");
    // Neighbor-gluing feature: drag moves correctly-ordered neighbors together
    expect(macro).toContain("glueNeighbors");
    expect(macro).toContain("glueInfo");
    expect(macro).toContain("onStart");
    expect(macro).toContain("aboveElements");
    expect(macro).toContain("belowElements");
    // No locking: elements are never filtered out or blocked from dragging
    expect(macro).not.toContain(".locked-neighbor");
    expect(macro).not.toContain("'locked-bottom'");
    expect(macro).not.toContain("onMove");
  });

  test("dragdropmultiple macro supports maxTrials parameter", () => {
    const startIdx = readmeContent.indexOf("@dragdropmultiple\n");
    const endIdx = readmeContent.indexOf("@end", startIdx);
    const macro = readmeContent.slice(startIdx, endIdx);
    expect(macro).toContain("parseInt('@3') || 0");
    expect(macro).toContain("lockQuizFailed(");
    expect(macro).toContain("maxTrials > 0 && savedData.tries >= maxTrials");
  });

  test("dragdropsort macro supports maxTrials parameter", () => {
    const startIdx = readmeContent.indexOf("@dragdropsort\n");
    const endIdx = readmeContent.indexOf("@end", startIdx);
    const macro = readmeContent.slice(startIdx, endIdx);
    expect(macro).toContain("parseInt('@3') || 0");
    expect(macro).toContain("lockQuizFailed(");
    expect(macro).toContain("maxTrials > 0 && savedData.tries >= maxTrials");
  });

  test("README.md documents new parameters in body sections", () => {
    expect(readmeContent).toContain("<randomize?>");
    expect(readmeContent).toContain("<maxTrials?>");
    expect(readmeContent).toContain("<glueNeighbors?>");
  });
});
