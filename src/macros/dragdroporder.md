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

  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);
        const choicesContainer = quizContainer.querySelector('.choices-container');
        const feedback = quizContainer.querySelector('.feedback');
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');
        const deprecationWarning = quizContainer.querySelector('.deprecation-warning');

        const dataKey = `quiz-${quizId}-data`;
        const savedData = JSON.parse(sessionStorage.getItem(dataKey)) ?? quizData;

        // Detect legacy API: @dragdroporder(@uid,<initial>,<correct>,<randomize?>,<maxTrials?>)
        // New API:    @dragdroporder(@uid,<correct>,<maxTrials?>,<lockNeighbors?>)
        // If @2 contains '|' it is a pipe-separated answer list → legacy API.
        const isLegacyApi = '@2'.includes('|');

        if (isLegacyApi) {
          console.warn('[dragdroporder] Deprecated API: @dragdroporder(@uid,<initial>,<correct>,<randomize?>,<maxTrials?>) will be removed in a future version. Please migrate to @dragdroporder(@uid,<correct>,<maxTrials?>,<lockNeighbors?>).');
          deprecationWarning.textContent = '⚠ Deprecated API: Please migrate to @dragdroporder(@uid,<correct>,<maxTrials?>,<lockNeighbors?>).';
          deprecationWarning.style.display = 'block';
        }

        const correctAnswers = isLegacyApi ? '@2'.split('|') : '@1'.split('|');
        const maxTrials = isLegacyApi ? parseInt('@4') || 0 : parseInt('@2') || 0;
        const randomize = isLegacyApi ? '@3' === 'true' : true;
        const lockNeighbors = isLegacyApi ? true : ('@3' !== 'false'); // pass 'false' to disable

        let currentAnswer = savedData.currentAnswer;
        if (currentAnswer === null) {
          currentAnswer = '@1'.split('|');
          if (randomize) {
            for (let i = currentAnswer.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              const temp = currentAnswer[i];
              currentAnswer[i] = currentAnswer[j];
              currentAnswer[j] = temp;
            }
          }
        }

        choicesContainer.innerHTML = currentAnswer.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');

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
            const currentOrder = choices.map(choice => choice.textContent.trim());
            const hints = getOrderHints(currentOrder, correctAnswers);
            choices.forEach((choice, i) => {
              const shadows = [];
              // 3px shadow bleeds out from the element edge by exactly 3px,
              // painting a thin green line at the top (-3px) or bottom (+3px).
              if (hints[i].top)    shadows.push('0 -3px 0 0 rgb(var(--lia-success))');
              if (hints[i].bottom) shadows.push('0  3px 0 0 rgb(var(--lia-success))');
              choice.style.boxShadow = shadows.join(', ');

              if (lockNeighbors) {
                const isLocked = hints[i].top || hints[i].bottom;
                choice.classList.toggle('locked-neighbor', isLocked);
                choice.classList.toggle('locked-bottom', !!hints[i].bottom);
                if (isLocked) choice.style.cursor = 'default';
              }
            });
          }

          const sortable = new Sortable(choicesContainer, {
            animation: 150,
            filter: lockNeighbors ? '.locked-neighbor' : '',
            onMove: function(evt) {
              if (!lockNeighbors) return true;
              const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
              const relatedIdx = choices.indexOf(evt.related);
              if (relatedIdx === -1) return true;
              if (evt.willInsertAfter) {
                // Inserting after evt.related: blocked if evt.related has a locked-bottom connection
                return !evt.related.classList.contains('locked-bottom');
              } else {
                if (relatedIdx > 0) {
                  // Inserting before evt.related: blocked if the element above it has locked-bottom
                  return !choices[relatedIdx - 1].classList.contains('locked-bottom');
                }
                // Inserting before the first element is always allowed
              }
              return true;
            },
          });

          // Restore hints and locked state if quiz was previously checked
          if (savedData.tries > 0) {
            updateHints();
          }
          
          checkingButton.addEventListener("click", function (e) {
            const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
            const currentOrder = choices.map(choice => choice.textContent.trim());

            savedData.currentAnswer = currentOrder;
            
            const isCorrect = isOrderCorrect(currentOrder, correctAnswers);

            savedData.tries++;
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();

            if (isCorrect) {
              savedData.solved = true;
              lockQuiz(feedback, checkingButton, choicesContainer, quizContainer);
            } else if (maxTrials > 0 && savedData.tries >= maxTrials) {
              savedData.failed = true;
              lockQuizFailed(feedback, checkingButton, choicesContainer, quizContainer);
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
