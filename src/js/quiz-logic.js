/**
 * Shared quiz logic functions used across LiaScript Drag and Drop macros.
 * These pure functions are inlined into the macro templates by the build script
 * and are independently testable via Jest.
 */

/**
 * Validates whether a string is a valid HTTP or HTTPS URL.
 * @param {string} string
 * @returns {boolean}
 */
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Determines hint indicators for the drag-order quiz.
 * Returns one entry per element indicating whether its top and/or bottom edge
 * should be highlighted: an edge is highlighted when the neighbour on that
 * side is the element that immediately follows/precedes it in the correct
 * answer, i.e. the two are already in the right consecutive order.
 * @param {string[]} currentOrder - Current order of items.
 * @param {string[]} correctAnswers - Expected order of items.
 * @returns {{top: boolean, bottom: boolean}[]}
 */
function getOrderHints(currentOrder, correctAnswers) {
  const n = currentOrder.length;
  const correctIdx = currentOrder.map(item => correctAnswers.indexOf(item));
  return currentOrder.map((_, i) => ({
    top:    i > 0     && correctIdx[i - 1] >= 0 && correctIdx[i] >= 0     && correctIdx[i]     - correctIdx[i - 1] === 1,
    bottom: i < n - 1 && correctIdx[i] >= 0     && correctIdx[i + 1] >= 0 && correctIdx[i + 1] - correctIdx[i]     === 1,
  }));
}

/**
 * Checks whether the given order exactly matches the correct order.
 * @param {string[]} currentOrder - Current order of items.
 * @param {string[]} correctAnswers - Expected order of items.
 * @returns {boolean}
 */
function isOrderCorrect(currentOrder, correctAnswers) {
  return (
    currentOrder.length === correctAnswers.length &&
    currentOrder.every((answer, index) => answer === correctAnswers[index])
  );
}

/**
 * Checks whether the selected answers contain exactly the correct answers
 * (order-independent).
 * @param {string[]} currentAnswers - Currently selected answers.
 * @param {string[]} correctAnswers - Expected correct answers.
 * @returns {boolean}
 */
function isMultipleChoiceCorrect(currentAnswers, correctAnswers) {
  return (
    currentAnswers.length === correctAnswers.length &&
    currentAnswers.every((answer) => correctAnswers.includes(answer))
  );
}

/**
 * Checks whether all drag-sort target buckets contain exactly the correct items
 * (order-independent within each bucket).
 * @param {string[][]} currentAnswers - Array of arrays, one per target bucket.
 * @param {string[][]} correctAnswers - Array of arrays with correct items per bucket.
 * @returns {boolean}
 */
function isSortCorrect(currentAnswers, correctAnswers) {
  for (let i = 0; i < currentAnswers.length; i++) {
    if (
      !(
        currentAnswers[i].length === correctAnswers[i].length &&
        currentAnswers[i].every((answer) => correctAnswers[i].includes(answer))
      )
    ) {
      return false;
    }
  }
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    isValidHttpUrl,
    getOrderHints,
    isOrderCorrect,
    isMultipleChoiceCorrect,
    isSortCorrect,
  };
}
