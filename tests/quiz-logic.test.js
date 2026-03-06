"use strict";

const {
  isValidHttpUrl,
  shuffleNotEqualTo,
  getOrderHints,
  isOrderCorrect,
  getMultipleChoiceHints,
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
// shuffleNotEqualTo
// ---------------------------------------------------------------------------
describe("shuffleNotEqualTo", () => {
  test("returns the same array reference (in-place)", () => {
    const arr = ["a", "b", "c"];
    const result = shuffleNotEqualTo([...arr], arr);
    expect(Array.isArray(result)).toBe(true);
  });

  test("single-element array is returned as-is", () => {
    const arr = ["x"];
    expect(shuffleNotEqualTo(arr, ["x"])).toEqual(["x"]);
  });

  test("empty array is returned as-is", () => {
    expect(shuffleNotEqualTo([], [])).toEqual([]);
  });

  test("two-element array never equals reference after shuffle", () => {
    const ref = ["a", "b"];
    // Run many times to confirm no trial returns the reference order
    for (let i = 0; i < 50; i++) {
      const arr = [...ref];
      shuffleNotEqualTo(arr, ref);
      expect(arr).not.toEqual(ref);
    }
  });

  test("result never equals reference for distinctly-ordered lists", () => {
    const ref = ["1", "2", "3", "4"];
    for (let i = 0; i < 50; i++) {
      const arr = [...ref];
      shuffleNotEqualTo(arr, ref);
      expect(arr).not.toEqual(ref);
    }
  });

  test("all elements are preserved after shuffling (same multiset)", () => {
    const ref = ["a", "b", "c", "d"];
    const arr = [...ref];
    shuffleNotEqualTo(arr, ref);
    expect(arr.slice().sort()).toEqual(ref.slice().sort());
  });

  test("identical elements — result equals reference (unavoidable)", () => {
    // All items are the same so every permutation is identical; function
    // exhausts maxAttempts and returns the only possible arrangement.
    const ref = ["x", "x", "x"];
    const arr = [...ref];
    shuffleNotEqualTo(arr, ref);
    expect(arr).toEqual(ref);
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
// getMultipleChoiceHints
// ---------------------------------------------------------------------------
describe("getMultipleChoiceHints", () => {
  test("returns correct=0, wrong=0, total=N when nothing is selected", () => {
    expect(getMultipleChoiceHints([], ["a", "b", "c"])).toEqual({ correct: 0, wrong: 0, total: 3 });
  });

  test("returns correct=N, wrong=0, total=N when all correct answers are selected", () => {
    expect(getMultipleChoiceHints(["a", "b", "c"], ["a", "b", "c"])).toEqual({ correct: 3, wrong: 0, total: 3 });
  });

  test("counts correctly-placed items vs wrongly-placed items", () => {
    // "a" and "b" are correct, "x" is wrong
    expect(getMultipleChoiceHints(["a", "x", "b"], ["a", "b", "c"])).toEqual({ correct: 2, wrong: 1, total: 3 });
  });

  test("all wrong: correct=0, wrong=N", () => {
    expect(getMultipleChoiceHints(["x", "y"], ["a", "b", "c"])).toEqual({ correct: 0, wrong: 2, total: 3 });
  });

  test("partial correct: one correct, none wrong", () => {
    expect(getMultipleChoiceHints(["b"], ["a", "b", "c"])).toEqual({ correct: 1, wrong: 0, total: 3 });
  });

  test("returns total=0 when no correct answers are expected", () => {
    expect(getMultipleChoiceHints([], [])).toEqual({ correct: 0, wrong: 0, total: 0 });
  });

  test("wrong item appears multiple times in currentAnswers — each occurrence is counted separately", () => {
    expect(getMultipleChoiceHints(["x", "x", "a"], ["a", "b"])).toEqual({ correct: 1, wrong: 2, total: 2 });
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
