<!--
author:   Michael Markert, Niklas Werner
email:    michael.markert@uni-jena.de, niklas.werner@student.tu-freiberg.de
version:  0.3
language: de
narrator: US English Female
tags: Wissensspeicher
title: Drag and Drop Quizzes
comment: This is a fork of Michael Markerts drag and drop quiz template which also allows has a mode for images. It provides **dragdropmultiple**, **dragdroporder** and **dragdropsort** quizzes.
logo: https://upload.wikimedia.org/wikipedia/commons/4/4c/Shell_sorting_algorithm_color_bars.svg
attribute: "Balu Ertl, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons"

script:   https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/Piktogramme/refs/heads/main/makros.md
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/LiaScript_ImageQuiz/refs/heads/main/README.md
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/Holzarten/refs/heads/main/makros.md

@dragdroporder
<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <span class="deprecation-warning" style="display: none; color: rgb(var(--lia-red)); font-weight: bold; margin-bottom: 10px;"></span>
  <div class="choices-container" style="display: flex; flex-direction: column; gap: 10px;">
  </div>

  <div style="margin-top: 10px;">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <br>
    <span class="feedback"></span>
  </div>
</div>

<script>
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

  void setTimeout(() => {
    (function(){
        const quizId = '@0';

        const quizData = {
          solved: false,
          failed: false,
          tries: 0,
          currentAnswer: null
        }

        function lockQuiz(feedback, checkingButton, choicesContainer, quizContainer){
          feedback.textContent = "Herzlichen Glückwunsch, das war die richtige Antwort";
          feedback.style.color = "rgb(var(--lia-success))";

          checkingButton.setAttribute("disabled", "");

          choicesContainer.style.borderColor = "rgb(var(--lia-grey))";
          quizContainer.style.borderColor = "rgb(var(--lia-grey))";

          choicesContainer.querySelectorAll("*").forEach((element) => {
            element.style.cursor = "default";
            element.style.borderColor = "rgb(var(--lia-grey))";
            element.style.boxShadow = "";
          });
        }

        function lockQuizFailed(feedback, checkingButton, choicesContainer, quizContainer){
          feedback.textContent = "Leider falsch. Die maximale Anzahl an Versuchen wurde erreicht.";
          feedback.style.color = "rgb(var(--lia-red))";

          checkingButton.setAttribute("disabled", "");

          choicesContainer.style.borderColor = "rgb(var(--lia-grey))";
          quizContainer.style.borderColor = "rgb(var(--lia-grey))";

          choicesContainer.querySelectorAll("*").forEach((element) => {
            element.style.cursor = "default";
            element.style.borderColor = "rgb(var(--lia-grey))";
            element.style.boxShadow = "";
          });
        }

        const quizContainer = document.querySelector(`#quiz-${quizId}`);
        const choicesContainer = quizContainer.querySelector('.choices-container');
        const feedback = quizContainer.querySelector('.feedback');
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');
        const deprecationWarning = quizContainer.querySelector('.deprecation-warning');

        const dataKey = `quiz-${quizId}-data`;
        const savedData = JSON.parse(sessionStorage.getItem(dataKey)) ?? quizData;

        // Detect legacy API: @dragdroporder(@uid,<initial>,<correct>,<randomize?>,<maxTrials?>)
        // New API:    @dragdroporder(@uid,<correct>,<maxTrials?>,<glueNeighbors?>)
        // If @2 contains '|' it is a pipe-separated answer list → legacy API.
        const isLegacyApi = '@2'.includes('|');

        if (isLegacyApi) {
          console.warn('[dragdroporder] Deprecated API: @dragdroporder(@uid,<initial>,<correct>,<randomize?>,<maxTrials?>) will be removed in a future version. Please migrate to @dragdroporder(@uid,<correct>,<maxTrials?>,<glueNeighbors?>).');
          deprecationWarning.textContent = '⚠ Deprecated API: Please migrate to @dragdroporder(@uid,<correct>,<maxTrials?>,<glueNeighbors?>).';
          deprecationWarning.style.display = 'block';
        }

        let correctAnswers = isLegacyApi ? '@2'.split('|') : '@1'.split('|');
        const maxTrials = isLegacyApi ? parseInt('@4') || 0 : parseInt('@2') || 0;
        const randomize = isLegacyApi ? '@3' === 'true' : true;
        const glueNeighbors = isLegacyApi ? true : ('@3' !== 'false'); // pass 'false' to disable

        const mode = correctAnswers.every(item => isValidHttpUrl(item)) ? "image" : "text";
        if (mode === "image") {
          correctAnswers = correctAnswers.map(url => encodeURI(url.replaceAll(" ", "")));
        }

        let currentAnswer = savedData.currentAnswer;
        if (currentAnswer === null) {
          currentAnswer = '@1'.split('|');
          if (mode === "image") {
            currentAnswer = currentAnswer.map(url => encodeURI(url.replaceAll(" ", "")));
          }
          if (randomize) {
            for (let i = currentAnswer.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              const temp = currentAnswer[i];
              currentAnswer[i] = currentAnswer[j];
              currentAnswer[j] = temp;
            }
          }
        }

        choicesContainer.innerHTML = '';
        currentAnswer.forEach(item => {
          let element;
          if (mode === "image") {
            element = document.createElement("img");
            element.src = item;
            element.alt = "";
            element.classList.add("choice");
            element.style.cssText = "cursor: move; user-select: none; max-width: 100%; max-height: 10rem; object-fit: contain; display: block;";
          } else {
            element = document.createElement("div");
            element.innerHTML = item;
            element.classList.add("choice", "lia-code", "lia-code--inline");
            element.style.cssText = "padding: 10px; border-radius: 4px; cursor: move; user-select: none;";
          }
          choicesContainer.appendChild(element);
        });

        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, choicesContainer, quizContainer);
        } else if (savedData.failed) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          lockQuizFailed(feedback, checkingButton, choicesContainer, quizContainer);
        } else {
          if (savedData.tries > 0) {
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();
            feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
            feedback.style.color = "rgb(var(--lia-red))";
          }

          function updateHints() {
            const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
            const currentOrder = choices.map(choice => mode === "image" ? choice.src : choice.textContent.trim());
            const hints = getOrderHints(currentOrder, correctAnswers);
            choices.forEach((choice, i) => {
              const shadows = [];
              // 3px shadow bleeds out from the element edge by exactly 3px,
              // painting a thin green line at the top (-3px) or bottom (+3px).
              if (hints[i].top)    shadows.push('0 -3px 0 0 rgb(var(--lia-success))');
              if (hints[i].bottom) shadows.push('0  3px 0 0 rgb(var(--lia-success))');
              choice.style.boxShadow = shadows.join(', ');
            });
          }

          // Tracks the glue group for the element currently being dragged.
          let glueInfo = null;

          const sortable = new Sortable(choicesContainer, {
            animation: 150,
            onStart: function(evt) {
              if (evt.from !== choicesContainer) return;
              if (!glueNeighbors) return;
              const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
              const draggedEl = evt.item;
              const draggedIdx = choices.indexOf(draggedEl);
              const currentOrder = choices.map(c => mode === "image" ? c.src : c.textContent.trim());
              const hints = getOrderHints(currentOrder, correctAnswers);

              // Collect elements above the dragged element that are glued to it.
              const aboveElements = [];
              let idx = draggedIdx - 1;
              while (idx >= 0 && hints[idx].bottom) {
                aboveElements.unshift(choices[idx]);
                idx--;
              }

              // Collect elements below the dragged element that are glued to it.
              const belowElements = [];
              idx = draggedIdx + 1;
              while (idx < choices.length && hints[idx - 1].bottom) {
                belowElements.push(choices[idx]);
                idx++;
              }

              if (aboveElements.length > 0 || belowElements.length > 0) {
                glueInfo = { above: aboveElements, below: belowElements };
                // Dim glue partners to signal they will travel with the dragged element.
                [...aboveElements, ...belowElements].forEach(el => {
                  el.style.opacity = '0.4';
                });
              } else {
                glueInfo = null;
              }
            },
            onEnd: function(evt) {
              if (evt.from !== choicesContainer) return;
              if (!glueNeighbors) return;

              if (glueInfo) {
                const draggedEl = evt.item;

                // Restore opacity of glue partners.
                [...glueInfo.above, ...glueInfo.below].forEach(el => {
                  el.style.opacity = '';
                });

                // Re-insert above elements just before the dragged element (maintaining order).
                glueInfo.above.forEach(el => {
                  choicesContainer.insertBefore(el, draggedEl);
                });

                // Re-insert below elements just after the dragged element (maintaining order).
                let refEl = draggedEl;
                glueInfo.below.forEach(el => {
                  if (refEl.nextSibling) {
                    choicesContainer.insertBefore(el, refEl.nextSibling);
                  } else {
                    choicesContainer.appendChild(el);
                  }
                  refEl = el;
                });

                glueInfo = null;
              }

              updateHints();
            },
          });

          // Restore hints and locked state if quiz was previously checked
          if (savedData.tries > 0) {
            updateHints();
          }
          
          checkingButton.addEventListener("click", function (e) {
            const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
            const currentOrder = choices.map(choice => mode === "image" ? choice.src : choice.textContent.trim());

            savedData.currentAnswer = currentOrder;
            
            const isCorrect = isOrderCorrect(currentOrder, correctAnswers);

            savedData.tries++;
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();

            if (isCorrect) {
              savedData.solved = true;
              lockQuiz(feedback, checkingButton, choicesContainer, quizContainer);
              sortable.destroy();
            } else if (maxTrials > 0 && savedData.tries >= maxTrials) {
              savedData.failed = true;
              lockQuizFailed(feedback, checkingButton, choicesContainer, quizContainer);
              sortable.destroy();
            } else {
              feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
              feedback.style.color = "rgb(var(--lia-red))";
              updateHints();
            }

            sessionStorage.setItem(dataKey, JSON.stringify(savedData));
          })
        }
    })();
  }, 100);
</script>

@end

@dragdropmultiple
<div style="width: 100%; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <div style="display: flex; gap: 20px;">
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Auswahl:</div>
      <div class="pool-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed; border-radius: 4px; display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px;" id="pool-@0">
      </div>
    </div>
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Antwort:</div>
      <div class="target-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed; border-radius: 4px; display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px;" id="target-@0">
      </div>
    </div>
  </div>
  
  
  <div style="margin: 10px">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <br>
    <span class="feedback"></span>
  </div>
</div>

<script>  
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

  const quizData = {
    solved: false,
    failed: false,
    tries: 0,
    currentPool: null,
    currentAnswer: []
  }

  function lockQuiz(feedback, checkingButton, poolContainer, targetContainer, quizContainer){
    feedback.textContent = "Herzlichen Glückwunsch, das war die richtige Antwort";
    feedback.style.color = "rgb(var(--lia-success))";

    checkingButton.setAttribute("disabled", "");

    poolContainer.style.borderColor = "rgb(var(--lia-grey))";
    targetContainer.style.borderColor = "rgb(var(--lia-grey))";
    quizContainer.style.borderColor = "rgb(var(--lia-grey))";

    poolContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
    targetContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
  }

  function lockQuizFailed(feedback, checkingButton, poolContainer, targetContainer, quizContainer){
    feedback.textContent = "Leider falsch. Die maximale Anzahl an Versuchen wurde erreicht.";
    feedback.style.color = "rgb(var(--lia-red))";

    checkingButton.setAttribute("disabled", "");

    poolContainer.style.borderColor = "rgb(var(--lia-grey))";
    targetContainer.style.borderColor = "rgb(var(--lia-grey))";
    quizContainer.style.borderColor = "rgb(var(--lia-grey))";

    poolContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
    targetContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
  }

  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);

        const poolContainer = quizContainer.querySelector('.pool-container');
        const targetContainer = quizContainer.querySelector('.target-container');
        const feedback = quizContainer.querySelector('.feedback');
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');

        const dataKey = `quiz-${quizId}-data`;
        const savedData = JSON.parse(sessionStorage.getItem(dataKey)) ?? quizData;

        const maxTrials = parseInt('@3') || 0;

        let correctAnswers = '@1'.split('|');
        const wrongAnswers = '@2'.split('|');
        const allAnswers = [...correctAnswers, ...wrongAnswers];

        const mode = allAnswers.every((answer) => isValidHttpUrl(answer)) ? "image" : "text";
        if (mode === "image") {
          correctAnswers = correctAnswers.map((url) => encodeURI(url.replaceAll(" ", "")));
        }

        let currentPool = savedData.currentPool;
        if (currentPool === null) {
          //shuffle array
          for (var i = allAnswers.length - 1; i > 0; i--) {
              var j = Math.floor(Math.random() * (i + 1));
              var temp = allAnswers[i];
              allAnswers[i] = allAnswers[j];
              allAnswers[j] = temp;
          }

          currentPool = allAnswers;
        }

        const formatString = (mode === "image")
          ? `<img src="placeholder" class="choice" style="cursor: move; user-select: none; max-width: 100%; max-height: 10rem">`
          : `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">placeholder</div>`;

        poolContainer.innerHTML = currentPool.map(item => formatString.replace("placeholder", item)).join('');
        targetContainer.innerHTML = savedData.currentAnswer.map(item => formatString.replace("placeholder", item)).join('');

        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, poolContainer, targetContainer, quizContainer);
        } else if (savedData.failed) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          lockQuizFailed(feedback, checkingButton, poolContainer, targetContainer, quizContainer);
        } else {
          if (savedData.tries > 0) {
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();
            feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
            feedback.style.color = "rgb(var(--lia-red))";
          }

          const poolSortable = new Sortable(poolContainer, {
            group: {
              name: quizId,
            },
            animation: 150,
            sort: false
          });
          
          const targetSortable = new Sortable(targetContainer, {
            group: {
              name: quizId,
            },
            animation: 150,
            sort: false
          });

          checkingButton.addEventListener("click", function (e) {
            const currentAnswers = Array.from(targetContainer.querySelectorAll('.choice'))
                                        .map(choice => (mode === "image") ? choice.src : choice.textContent.trim());
            savedData.currentAnswer = currentAnswers;

            savedData.currentPool = Array.from(poolContainer.querySelectorAll('.choice'))
                                        .map(choice => (mode === "image") ? choice.src : choice.textContent.trim());
            
            const isCorrect = isMultipleChoiceCorrect(currentAnswers, correctAnswers);

            savedData.tries++;
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();

            if (isCorrect) {
              savedData.solved = true;

              const groupSetting = {name: quizId, pull: false, put: false};
              poolSortable.option("group", groupSetting);
              targetSortable.option("group", groupSetting);

              lockQuiz(feedback, checkingButton, poolContainer, targetContainer, quizContainer);
            } else if (maxTrials > 0 && savedData.tries >= maxTrials) {
              savedData.failed = true;
              lockQuizFailed(feedback, checkingButton, poolContainer, targetContainer, quizContainer);
            } else {
              feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
              feedback.style.color = "rgb(var(--lia-red))";
            }

            sessionStorage.setItem(dataKey, JSON.stringify(savedData));
          })
        }
    })();
  }, 100);
</script>

@end

@dragdropmultipleimages
<div style="width: 100%; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <span style="font-size: 3rem; color: rgb(var(--lia-red))">dragdropmultiple unterstützt jetzt auch Bilder. <br> dragdropmultipleimages wird nicht weiter entwickelt!</span>
</div>

@end

@dragdropsort
<div style="width: 100%; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <div style="display: flex; gap: 20px;">
    <div class="pool-container droppable" style="flex: 1; margin-top: 10px; display: flex; flex-direction: column; gap: 10px; border: 1px dashed rgb(var(--color-highlight)); border-radius: 4px; padding: 5px; padding-bottom: 15px">
    </div>
    <div style="flex: 2;">
      <div class="target-container" style="display: flex; flex-direction: column; gap: 10px;">
      </div>
    </div>
  </div>
  
  <div style="margin: 10px">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <br>
    <span class="feedback"></span>
  </div>
</div>

<script>  
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

  const quizData = {
    solved: false,
    failed: false,
    tries: 0,
    currentPool: null,
    currentAnswers: []
  }

  function lockQuiz(feedback, checkingButton, quizContainer){
    feedback.textContent = "Herzlichen Glückwunsch, das war die richtige Antwort";
    feedback.style.color = "rgb(var(--lia-success))";

    checkingButton.setAttribute("disabled", "");

    quizContainer
      .querySelectorAll(".choice")
      .forEach((element) => {
        element.style.cursor = "default";
        element.draggable = false;
        element.style.borderColor = "rgb(var(--lia-grey))";
        element.style.outline = "";
      });
  }

  function lockQuizFailed(feedback, checkingButton, quizContainer){
    feedback.textContent = "Leider falsch. Die maximale Anzahl an Versuchen wurde erreicht.";
    feedback.style.color = "rgb(var(--lia-red))";

    checkingButton.setAttribute("disabled", "");

    quizContainer
      .querySelectorAll(".choice")
      .forEach((element) => {
        element.style.cursor = "default";
        element.draggable = false;
        element.style.borderColor = "rgb(var(--lia-grey))";
        element.style.outline = "";
      });
  }

  function colorItems(droppables, correctAnswers, poolContainer, mode) {
    for (let i = 0; i < droppables.length; i++) {
      const correctValues = mode === "image"
        ? correctAnswers[i].map(v => encodeURI(v.replaceAll(" ", "")))
        : correctAnswers[i];
      droppables[i].querySelectorAll('.choice').forEach(item => {
        const itemValue = (mode === "image") ? item.src : item.textContent.trim();
        const color = correctValues.includes(itemValue) ? "rgb(var(--lia-success))" : "rgb(var(--lia-red))";
        if (mode === "image") {
          item.style.outline = `2px solid ${color}`;
        } else {
          item.style.borderColor = color;
        }
      });
    }
    poolContainer.querySelectorAll('.choice').forEach(item => {
      if (mode === "image") {
        item.style.outline = "2px solid rgb(var(--lia-red))";
      } else {
        item.style.borderColor = "rgb(var(--lia-red))";
      }
    });
  }

  function dropHandler(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    if (ev.target.classList.contains("droppable")) {
      ev.target.appendChild(document.getElementById(data));
    } else {
      ev.target.parentElement.appendChild(document.getElementById(data));
    }
  }
  
  function dragstartHandler(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }

  function dragoverHandler(ev) {
    ev.preventDefault();
  }

  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);

        const poolContainer = quizContainer.querySelector('.pool-container');
        const targetContainer = quizContainer.querySelector('.target-container');
        const feedback = quizContainer.querySelector('.feedback');
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');

        const dataKey = `quiz-${quizId}-data`;
        const savedData = JSON.parse(sessionStorage.getItem(dataKey)) ?? quizData;

        const maxTrials = parseInt('@3') || 0;

        let targets = [];
        let pool = [];
        let correctAnswers = [];

        '@1'.split('|').forEach(pair => {
          let splitPair = pair.split(';');
          targets.push(splitPair[0]);

          splitPair.shift();

          pool.push(...splitPair);
          correctAnswers.push(splitPair)
        });

        const mode = pool.every((item) => isValidHttpUrl(item))  ? "image" : "text";
        if (mode === "image") {
          pool = pool.map((url) => encodeURI(url.replaceAll(" ", "")));
        }

        let currentPool = savedData.currentPool;
        if (currentPool === null) {
          //shuffle array
          currentPool = pool;

          for (var i = currentPool.length - 1; i > 0; i--) {
              var j = Math.floor(Math.random() * (i + 1));
              var temp = currentPool[i];
              currentPool[i] = currentPool[j];
              currentPool[j] = temp;
          }
        }

        const preFillCount = parseInt('@2') || 0;
        if (preFillCount > 0 && savedData.currentPool === null) {
          savedData.currentAnswers = targets.map(() => []);
          let filled = 0;
          for (let i = 0; i < correctAnswers.length && filled < preFillCount; i++) {
            if (correctAnswers[i].length > 0) {
              const rawItem = correctAnswers[i][0];
              const poolItem = mode === "image" ? encodeURI(rawItem.replaceAll(" ", "")) : rawItem;
              const poolIndex = currentPool.indexOf(poolItem);
              if (poolIndex !== -1) {
                currentPool.splice(poolIndex, 1);
                savedData.currentAnswers[i].push(poolItem);
                filled++;
              }
            }
          }
        }

        for (let i = 0; i < currentPool.length; i++) {
          let container;
          if (mode === "image") {
            container = document.createElement("img");
            container.src = currentPool[i];
            container.classList.add("choice");
            container.style.cssText = "cursor: move; user-select: none; max-width: 100%; max-height: 10rem; object-fit: contain";
          } else {
            container = document.createElement("div");
            container.innerHTML = currentPool[i];
            container.classList.add("choice", "lia-code", "lia-code--inline");
            container.style.cssText = "padding: 10px; border-radius: 4px; cursor: move; user-select: none;";
          };

          container.draggable = "true";
          container.ondragstart = dragstartHandler;

          container.id = quizId + "-" + i;
          
          poolContainer.appendChild(container);
        }

        poolContainer.ondrop = dropHandler;
        poolContainer.ondragover = dragoverHandler;

        const formatStringImage = `<div class="lia-code lia-code--inline" style="flex: 1; display: flex; flex-direction: column; justify-content: center; border-radius: 4px; padding: 10px; user-select: none"><img src="placeholder" style="flex: 1; user-select: none; max-width: 100%; max-height: 10rem; object-fit: contain"></div>`;

        const formatStringText = `<div class="lia-code lia-code--inline" style="flex: 1; display: flex; flex-direction: column; justify-content: center; border-radius: 4px; padding: 10px; user-select: none"><span>placeholder</span></div>`;

        targets.forEach(item => {
          const outerDiv = document.createElement("div");
          outerDiv.style.cssText = "display: flex; flex-direction: row-reverse; gap: 10px";
          outerDiv.innerHTML = isValidHttpUrl(item) ? formatStringImage.replace("placeholder", item) : formatStringText.replace("placeholder", item);

          let dropDiv = document.createElement("div");
          dropDiv.classList.add("droppable");
          dropDiv.ondrop = dropHandler;
          dropDiv.ondragover = dragoverHandler;
          dropDiv.style.cssText = "flex: 1; min-width: 100px, min-height: 100%; border: 1px dashed rgb(var(--color-highlight)); border-radius: 4px; padding: 5px; display: flex; flex-direction: column; gap: 5px";

          outerDiv.appendChild(dropDiv);
          targetContainer.appendChild(outerDiv);
        });

        const droppables = targetContainer.querySelectorAll(".droppable");
        for (let i = 0; i < savedData.currentAnswers.length; i++) {
          for (let j = 0; j < savedData.currentAnswers[i].length; j++) {
            let container;
            if (mode === "image") {
              container = document.createElement("img");
              container.src = savedData.currentAnswers[i][j];
              container.classList.add("choice");
              container.style.cssText = "cursor: move; user-select: none; max-width: 100%; max-height: 10rem; object-fit: contain";
            } else {
              container = document.createElement("div");
              container.innerHTML = savedData.currentAnswers[i][j];
              container.classList.add("choice", "lia-code", "lia-code--inline");
              container.style.cssText = "padding: 10px; border-radius: 4px; cursor: move; user-select: none;";
            };

            container.draggable = "true";
            container.ondragstart = dragstartHandler;

            container.id = quizId + "-" + i + j;
            
            droppables[i].appendChild(container);
          }
        }


        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, quizContainer);
        } else if (savedData.failed) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          colorItems(droppables, correctAnswers, poolContainer, mode);
          lockQuizFailed(feedback, checkingButton, quizContainer);
        } else {
          if (savedData.tries > 0) {
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();
            feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
            feedback.style.color = "rgb(var(--lia-red))";
            colorItems(droppables, correctAnswers, poolContainer, mode);
          }

          checkingButton.addEventListener("click", function (e) {
            const currentAnswers = Array
                                    .from(targetContainer.querySelectorAll('.droppable'))
                                    .map(dropContainer => dropContainer.querySelectorAll('.choice'))
                                    .map(answers => Array.from(answers).map(choice => (mode === "image") ? choice.src : choice.textContent.trim()));
            savedData.currentAnswers = currentAnswers;

            savedData.currentPool = Array.from(poolContainer.querySelectorAll('.choice'))
                                        .map(choice => (mode === "image") ? choice.src : choice.textContent.trim());

            quizContainer.querySelectorAll('.choice').forEach(item => {
              item.style.borderColor = "";
              item.style.outline = "";
            });

            const isCorrect = isSortCorrect(currentAnswers, correctAnswers);

            savedData.tries++;
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();

            if (isCorrect) {
              savedData.solved = true;

              lockQuiz(feedback, checkingButton, quizContainer);
            } else if (maxTrials > 0 && savedData.tries >= maxTrials) {
              savedData.failed = true;
              colorItems(droppables, correctAnswers, poolContainer, mode);
              lockQuizFailed(feedback, checkingButton, quizContainer);
            } else {
              colorItems(droppables, correctAnswers, poolContainer, mode);
              feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
              feedback.style.color = "rgb(var(--lia-red))";
            }

            sessionStorage.setItem(dataKey, JSON.stringify(savedData));
          })
        }
    })();
  }, 100);
</script>

@end
-->

# Drag and Drop Quizzes
<!--
@img: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/LiaScript_ImageQuiz/main/img/mustang.jpg
-->

This is a fork of Michael Markerts drag and drop quiz template which also allows has a mode for images.

* See the Github version of this document [here...](https://github.com/Ifi-DiAgnostiK-Project/LiaScript_DragAndDrop_Template/)
* See the LiaScript version of this document [here...](https://liascript.github.io/course/?https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/LiaScript_DragAndDrop_Template/refs/heads/main/README.md)
* Developer guide (build, test, extend): [docs/development.md](docs/development.md)

To use these macros within your document, simply import it into LiaScript via:

`import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/LiaScript_DragAndDrop_Template/refs/heads/main/README.md`

## Order quiz

Try to order these items correctly by dragging and dropping them!

@dragdroporder(@uid,1|2|3|4)

Try to order these items correctly by dragging and dropping them (hint: should be a sentence)!

@dragdroporder(@uid,this|is|the|solution)

This example allows only 3 attempts before locking the quiz as failed:

@dragdroporder(@uid,this|is|the|solution,3)

This example disables the neighbor-gluing feature (correctly ordered pairs will not travel together when dragging):

@dragdroporder(@uid,this|is|the|solution,3,false)

You can also use images — if all items are valid URLs the quiz automatically switches to image mode:

<!--
@basepath: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img
@mustang: @basepath/mustang.jpg
@f18: @basepath/f18.jpg
@chevrolet: @basepath/chevrolet.jpg
@ford: @basepath/ford.jpg
-->

@dragdroporder(@uid,@mustang|@f18|@chevrolet|@ford)

### How to use

The signature for the order quizzes is

`@dragdroporder(@uid,<correct>,<maxTrials?>,<glueNeighbors?>)`,

, where

* `@uid` generates an id for the quiz which is important for correct implementation,
* `<correct>` is the correct order of elements (separated by `|`); the items are always shuffled randomly on first load,
* `<maxTrials>` (optional) is a positive integer — if provided, the quiz is locked as failed after that many wrong attempts,
* `<glueNeighbors>` (optional, default `true`) — when `true`, clicking "Prüfen" reveals hints for correctly-ordered adjacent pairs (green edge highlights) and glues those pairs together: dragging one element in a correctly-ordered run automatically moves the whole run with it. Pass `false` to disable this feature entirely.

Example: `@dragdroporder(@uid,this|is|the|solution)`

Example with 3 max trials: `@dragdroporder(@uid,this|is|the|solution,3)`

Example with neighbor-gluing disabled: `@dragdroporder(@uid,this|is|the|solution,3,false)`

Example with 3 max trials and neighbor-gluing disabled: `@dragdroporder(@uid,this|is|the|solution,3,false)`

If you want to use images, provide the full public URLs of the images as items. If every item is a valid URL, the quiz automatically switches to image mode. You may use LiaScript macros to shorten long URLs (see example above).

Example with images: `@dragdroporder(@uid,https://example.com/img1.jpg|https://example.com/img2.jpg|https://example.com/img3.jpg)`

#### Deprecated API

The previous signature `@dragdroporder(@uid,<initial>,<correct>,<randomize?>,<maxTrials?>)` is still supported but deprecated and will be removed in a future version. Using it will print a warning to the browser console. Please migrate to the new signature.

* `<initial>` was the initial (possibly non-randomized) display order,
* `<randomize?>` was an optional flag (`true`) to shuffle on first load.

Note: when using the deprecated API the neighbor-locking feature is always active.

Example (deprecated): `@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)`

Example with randomize and 3 max trials (deprecated): `@dragdroporder(@uid,solution|is|this|the,this|is|the|solution,true,3)`


## Multiple choice quiz
<!--
@basepath: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img
mustang: @basepath/mustang.jpg
@f18: @basepath/f18.jpg
@chevrolet: @basepath/chevrolet.jpg
@ford: @basepath/ford.jpg
-->

Select the correct numbers from the pool (hint: odd numbers only)!

@dragdropmultiple(@uid,1|3|5,2|4|6)

You can also use images (hint: cars are cool, but planes are cooler)!

@dragdropmultiple(@uid, @mustang|@f18, @chevrolet|@ford)

### How to use
The signature for the selection quizzes is 

`@dragdropmultiple(@uid,<correct>,<wrong>,<maxTrials?>)`,

, where

* `@uid` works the same as in the order quiz,
* `<correct>` are the correct answers (separated by `|`),
* `<wrong>` are the wrong answers (again separated by `|`),
* `<maxTrials>` (optional) is a positive integer — if provided, the quiz is locked as failed after that many wrong attempts.

Note: the pool of answers is always shuffled randomly on first load.

Example: `@dragdropmultiple(@uid,1|3|5,2|4|6)`

Example with 3 max trials: `@dragdropmultiple(@uid,1|3|5,2|4|6,3)`

If you want to use the images, you need to input the whole public URLs to the images as parameters. If all parameters are viable URLs, the quiz automatically uses image mode.

You might want to use makros in the case of many/long URLs. Just look at the source code of the example quiz to see how it works. (Note: This only works if the comment is directly under the headline, and the makros only exist for that page. If you want to reuse them somewhere else, put them into the header comment.)

## Sorting Quiz
<!--
@basepath: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img
mustang: @basepath/mustang.jpg
@f18: @basepath/f18.jpg
@chevrolet: @basepath/chevrolet.jpg
@ford: @basepath/ford.jpg
-->

Try sorting these words to the correct field! Some fields may have multiple correct answers.

@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object)

You can also sort images!

@dragdropsort(@uid,Plane;@mustang|Jet;@f18|Car;@chevrolet)

This example uses the pre-fill feature to give students a head start (2 answers pre-placed):

@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object,2)

### How to use

The signature for the sorting quizzes is 

`@dragdropsort(@uid,<answers>,<prefill?>,<maxTrials?>)`,

, where

* `@uid` works the same as in the order quiz,
* `<pairs>` are the pairs (again separated by `|`), consisting of the target and at least one affiliated answer (separated by `;`), and
* `<prefill>` (optional) is a positive integer — if provided, that many answers are pre-placed into their correct targets to give students a head start,
* `<maxTrials>` (optional) is a positive integer — if provided, the quiz is locked as failed after that many wrong attempts.

Note: the pool of answers is always shuffled randomly on first load.

Example: `@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object)`
The target is always the first one in the pair-list.

Example with pre-fill: `@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object,2)` pre-places the first correct answer for each of the first 2 targets.

Example with pre-fill and 3 max trials: `@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object,2,3)`

After a wrong check, correctly placed items are highlighted in green and incorrectly placed (or unplaced) items are highlighted in red.

Using images for the answers works the same as in the multiple choice quiz, but targets can be a mix of images and text.
