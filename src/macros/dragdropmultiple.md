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
  {{QUIZ_LOGIC}}

  const quizData = {
    solved: false,
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

        if (savedData.tries > 0) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
          feedback.style.color = "rgb(var(--lia-red))";
        }     

        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, poolContainer, targetContainer, quizContainer);
        } else {
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
