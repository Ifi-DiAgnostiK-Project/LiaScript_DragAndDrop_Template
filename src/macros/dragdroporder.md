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
  {{QUIZ_LOGIC}}

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
