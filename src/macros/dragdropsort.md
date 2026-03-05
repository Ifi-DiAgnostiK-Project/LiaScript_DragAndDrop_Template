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
  {{QUIZ_LOGIC}}

  const quizData = {
    solved: false,
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


        if (savedData.tries > 0) {
          checkingButton.textContent = "Prüfen " + savedData.tries.toString();
          feedback.textContent = "Die richtige Antwort wurde noch nicht gegeben";
          feedback.style.color = "rgb(var(--lia-red))";
          if (!savedData.solved) {
            colorItems(droppables, correctAnswers, poolContainer, mode);
          }
        }     

        if (savedData.solved) {
          lockQuiz(feedback, checkingButton, quizContainer);
        } else {
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
