"use strict";

const {
  isValidHttpUrl,
  getOrderHints,
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
// getOrderHints
// ---------------------------------------------------------------------------
describe("getOrderHints", () => {
  test("problem-statement example: fu|bar|extreme|for|persons|done vs correct fu|bar|for|extreme|persons|done", () => {
    const correct = ["fu", "bar", "for", "extreme", "persons", "done"];
    const user   = ["fu", "bar", "extreme", "for", "persons", "done"];
    const hints  = getOrderHints(user, correct);
    // fu→bar is a correct consecutive pair: fu gets bottom, bar gets top
    expect(hints[0]).toEqual({ top: false, bottom: true  });  // fu
    expect(hints[1]).toEqual({ top: true,  bottom: false });  // bar
    // extreme and for are swapped – neither edge is marked
    expect(hints[2]).toEqual({ top: false, bottom: false }); // extreme
    expect(hints[3]).toEqual({ top: false, bottom: false }); // for
    // persons→done is a correct consecutive pair
    expect(hints[4]).toEqual({ top: false, bottom: true  }); // persons
    expect(hints[5]).toEqual({ top: true,  bottom: false }); // done
  });

  test("new-requirement example: fu|bar|persons|done|extreme|for – only edges between fu-bar and persons-done are marked", () => {
    const correct = ["fu", "bar", "for", "extreme", "persons", "done"];
    const user   = ["fu", "bar", "persons", "done", "extreme", "for"];
    const hints  = getOrderHints(user, correct);
    // fu(0)→bar(1): diff=1 ✓
    expect(hints[0]).toEqual({ top: false, bottom: true  }); // fu
    expect(hints[1]).toEqual({ top: true,  bottom: false }); // bar  (bar→persons: diff=3 ✗)
    // persons(4)→done(5): diff=1 ✓  but bar(1)→persons(4): diff=3 ✗
    expect(hints[2]).toEqual({ top: false, bottom: true  }); // persons
    expect(hints[3]).toEqual({ top: true,  bottom: false }); // done  (done→extreme: diff=-2 ✗)
    expect(hints[4]).toEqual({ top: false, bottom: false }); // extreme
    expect(hints[5]).toEqual({ top: false, bottom: false }); // for
  });

  test("perfectly correct order: all inner edges marked, first only bottom, last only top", () => {
    const order = ["a", "b", "c"];
    const hints = getOrderHints(order, order);
    expect(hints[0]).toEqual({ top: false, bottom: true  }); // a
    expect(hints[1]).toEqual({ top: true,  bottom: true  }); // b (connected on both sides)
    expect(hints[2]).toEqual({ top: true,  bottom: false }); // c
  });

  test("completely reversed order: no edges marked", () => {
    const correct = ["a", "b", "c"];
    const user   = ["c", "b", "a"];
    const hints  = getOrderHints(user, correct);
    hints.forEach(h => expect(h).toEqual({ top: false, bottom: false }));
  });

  test("single element: no edges (no neighbours)", () => {
    const hints = getOrderHints(["x"], ["x"]);
    expect(hints[0]).toEqual({ top: false, bottom: false });
  });

  test("empty array: returns empty array", () => {
    expect(getOrderHints([], [])).toEqual([]);
  });

  test("non-adjacent correct pair is not highlighted", () => {
    // a(0) b(1) d(3) c(2) – a→b correct, b→d skips one so NOT adjacent
    const correct = ["a", "b", "c", "d"];
    const user   = ["a", "b", "d", "c"];
    const hints  = getOrderHints(user, correct);
    expect(hints[0]).toEqual({ top: false, bottom: true  }); // a→b ✓
    expect(hints[1]).toEqual({ top: true,  bottom: false }); // b; b→d: diff=2 ✗
    expect(hints[2]).toEqual({ top: false, bottom: false }); // d; d→c: diff=-1 ✗
    expect(hints[3]).toEqual({ top: false, bottom: false }); // c
  });

  test("all-elements-neighbors case (3|4|1|2 vs 1|2|3|4): every element has at least one neighbor hint", () => {
    // This is the scenario from the issue: all four elements are correctly-ordered
    // neighbours of their current sibling, so the old lock feature would block
    // every element and make the quiz impossible to solve.
    const correct = ["1", "2", "3", "4"];
    const user    = ["3", "4", "1", "2"];
    const hints   = getOrderHints(user, correct);
    // 3→4 is a correct consecutive pair
    expect(hints[0]).toEqual({ top: false, bottom: true  }); // 3
    expect(hints[1]).toEqual({ top: true,  bottom: false }); // 4
    // 1→2 is a correct consecutive pair
    expect(hints[2]).toEqual({ top: false, bottom: true  }); // 1
    expect(hints[3]).toEqual({ top: true,  bottom: false }); // 2
    // Every element has at least one neighbour hint – the glue feature must
    // move neighbours together rather than locking them in place.
    hints.forEach(h => expect(h.top || h.bottom).toBe(true));
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
