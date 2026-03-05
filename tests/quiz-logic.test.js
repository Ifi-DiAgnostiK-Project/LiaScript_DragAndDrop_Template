"use strict";

const {
  isValidHttpUrl,
  isOrderCorrect,
  isMultipleChoiceCorrect,
  isSortCorrect,
} = require("../src/js/quiz-logic");

// ---------------------------------------------------------------------------
// isValidHttpUrl
// ---------------------------------------------------------------------------
describe("isValidHttpUrl", () => {
  test("returns true for a valid https URL", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });

  test("returns true for a valid http URL", () => {
    expect(isValidHttpUrl("http://example.com/path?q=1")).toBe(true);
  });

  test("returns false for a plain string", () => {
    expect(isValidHttpUrl("hello")).toBe(false);
  });

  test("returns false for an ftp URL", () => {
    expect(isValidHttpUrl("ftp://files.example.com")).toBe(false);
  });

  test("returns false for an empty string", () => {
    expect(isValidHttpUrl("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isOrderCorrect
// ---------------------------------------------------------------------------
describe("isOrderCorrect", () => {
  test("returns true when order matches exactly", () => {
    expect(isOrderCorrect(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
  });

  test("returns false when order differs", () => {
    expect(isOrderCorrect(["b", "a", "c"], ["a", "b", "c"])).toBe(false);
  });

  test("returns false when lengths differ", () => {
    expect(isOrderCorrect(["a", "b"], ["a", "b", "c"])).toBe(false);
  });

  test("returns true for single-element arrays that match", () => {
    expect(isOrderCorrect(["x"], ["x"])).toBe(true);
  });

  test("returns false for single-element arrays that differ", () => {
    expect(isOrderCorrect(["x"], ["y"])).toBe(false);
  });

  test("returns true for an empty array pair", () => {
    expect(isOrderCorrect([], [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isMultipleChoiceCorrect
// ---------------------------------------------------------------------------
describe("isMultipleChoiceCorrect", () => {
  test("returns true when selected set equals correct set (same order)", () => {
    expect(isMultipleChoiceCorrect(["1", "3", "5"], ["1", "3", "5"])).toBe(true);
  });

  test("returns true when selected set equals correct set (different order)", () => {
    expect(isMultipleChoiceCorrect(["5", "1", "3"], ["1", "3", "5"])).toBe(true);
  });

  test("returns false when a wrong answer is included", () => {
    expect(isMultipleChoiceCorrect(["1", "3", "2"], ["1", "3", "5"])).toBe(false);
  });

  test("returns false when too few answers are selected", () => {
    expect(isMultipleChoiceCorrect(["1", "3"], ["1", "3", "5"])).toBe(false);
  });

  test("returns false when too many answers are selected", () => {
    expect(isMultipleChoiceCorrect(["1", "3", "5", "7"], ["1", "3", "5"])).toBe(false);
  });

  test("returns true for empty selection when no correct answers expected", () => {
    expect(isMultipleChoiceCorrect([], [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isSortCorrect
// ---------------------------------------------------------------------------
describe("isSortCorrect", () => {
  test("returns true when all buckets contain exactly the right items", () => {
    expect(
      isSortCorrect(
        [["Plane", "Jet"], ["Color"], ["Object"]],
        [["Plane", "Jet"], ["Color"], ["Object"]]
      )
    ).toBe(true);
  });

  test("returns true when items within a bucket are in a different order", () => {
    expect(
      isSortCorrect(
        [["Jet", "Plane"], ["Color"]],
        [["Plane", "Jet"], ["Color"]]
      )
    ).toBe(true);
  });

  test("returns false when an item is placed in the wrong bucket", () => {
    expect(
      isSortCorrect(
        [["Color", "Jet"], ["Plane"]],
        [["Plane", "Jet"], ["Color"]]
      )
    ).toBe(false);
  });

  test("returns false when a bucket is missing an item", () => {
    expect(
      isSortCorrect(
        [["Plane"], ["Color"]],
        [["Plane", "Jet"], ["Color"]]
      )
    ).toBe(false);
  });

  test("returns false when a bucket has an extra item", () => {
    expect(
      isSortCorrect(
        [["Plane", "Jet", "Extra"], ["Color"]],
        [["Plane", "Jet"], ["Color"]]
      )
    ).toBe(false);
  });

  test("returns true for an empty sort (no buckets)", () => {
    expect(isSortCorrect([], [])).toBe(true);
  });
});
