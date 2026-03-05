<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
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
    });
  }

  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);
        const choicesContainer = quizContainer.querySelector('.choices-container');
        const feedback = quizContainer.querySelector('.feedback');
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');

        const dataKey = `quiz-${quizId}-data`;
        const savedData = JSON.parse(sessionStorage.getItem(dataKey)) ?? quizData;

        const correctAnswers = '@2'.split('|');
        const randomize = '@3' === 'true';
        const maxTrials = parseInt('@4') || 0;

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

          const sortable = new Sortable(choicesContainer, {
            animation: 150,
          });
          
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
            }

            sessionStorage.setItem(dataKey, JSON.stringify(savedData));
          })
        }
    })();
  }, 100);
</script>
