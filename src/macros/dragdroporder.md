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
        const currentAnswer = savedData.currentAnswer ?? '@1'.split('|');

        choicesContainer.innerHTML = currentAnswer.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');

        if (savedData.tries > 0) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
          feedback.style.color = "rgb(var(--lia-red))";
        }     

        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, choicesContainer, quizContainer);
        } else {
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
