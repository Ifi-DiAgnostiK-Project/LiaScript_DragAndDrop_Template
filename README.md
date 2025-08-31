<!--
author:   Michael Markert, Niklas Werner
email:    michael.markert@uni-jena.de, niklas.werner@student.tu-freiberg.de
version:  0.2
language: de
narrator: US English Female

script:   https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/Piktogramme/refs/heads/main/makros.md
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/LiaScript_ImageQuiz/refs/heads/main/README.md
import: https://raw.githubusercontent.com/Ifi-DiAgnostiK-Project/Holzarten/refs/heads/main/makros.md

@dragdroporder
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
            
            const isCorrect = currentOrder.length === correctAnswers.length && 
                              currentOrder.every((answer, index) => answer === correctAnswers[index]);

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

  function isValidHttpUrl(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }

    return url.protocol === "http:" || url.protocol === "https:";
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
            
            const isCorrect = currentAnswers.length === correctAnswers.length &&
                              currentAnswers.every(answer => correctAnswers.includes(answer));

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

  function isValidHttpUrl(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }

    return url.protocol === "http:" || url.protocol === "https:";
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
            
            let isCorrect = true;
            for (let i = 0; i < currentAnswers.length; i++) {
              if (! (currentAnswers[i].length === correctAnswers[i].length && currentAnswers[i].every(answer => correctAnswers[i].includes(answer)))) {
                isCorrect = false;
                break;
              }
            }

            savedData.tries++;
            checkingButton.textContent = "Prüfen " + savedData.tries.toString();

            if (isCorrect) {
              savedData.solved = true;

              lockQuiz(feedback, checkingButton, quizContainer);
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
-->

# Drag and Drop Quizzes
<!--
@img: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img/mustang.jpg
-->

@dragdropsort(@uid,@img;Test111;Test11|Test2;Test22|Test3;Test33|Test4;Test44)
@dragdropsort(@uid,Test1;@img|Test2;@img)

This is a fork of Michael Markerts drag and drop quiz template which also allows has a mode for images.

* See the Github version of this document [here...](https://github.com/wenik35/LiaScript_DragAndDrop_Template/)
* See the LiaScript version of this document [here...](https://liascript.github.io/course/?https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md)

To use these macros within your document, simply import it into LiaScript via:

`import: https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md`

## Drag and drop order quiz

Try to order these items correctly by dragging and dropping them!

<!-- data-randomize -->
@dragdroporder(@uid,4|2|3|1,1|2|3|4)

Try to order these items correctly by dragging and dropping them (hint: should be a sentence)!

@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)

## Drag and drop multiple choice quiz

Select the correct numbers from the pool (hint: odd numbers only)!

@dragdropmultiple(@uid,1|3|5,2|4|6)

Select the correct numbers from the pool (hint: even numbers only)!

@dragdropmultiple(@uid,2|4|6,1|3|5)

## Drag and drop image quiz
<!--
@basepath: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img
mustang: @basepath/mustang.jpg
@f18: @basepath/f18.jpg
@chevrolet: @basepath/chevrolet.jpg
@ford: @basepath/ford.jpg
-->

Select the correct images from the pool (hint: cars are cool, but planes are cooler)!

@dragdropmultiple(@uid, @mustang|@f18, @chevrolet|@ford)

## How to use it in your LiaScript

### Order

Just put 

`@dragdroporder(@uid,4|2|3|1,1|2|3|4)`

, or 

`@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)`

, where

* `@uid` generates an id for the quiz which is important for correct implementation
* parameter after `@uid` is the initial order of elements (separated by `|`), and the
* second parameter is the correct order of elements (separated by `|`)

I tried to avoid having `@uid`in the script by nesting in the header (`@dragdroporder: @dragdroporder_(@uid,@0)`) but then the second parameter is not written correctly which breaks the quiz.

### Selection

The signature for the selection quizzes is 

`@dragdropmultiple(@uid,<correct>,<wrong>)`,

, where

* `@uid` works the same as in the order quiz,
* `<correct>` are the correct answers (separated by `|`),
* `<wrong>` are the correct answers (again separated by `|`).

If you want to use the image selection quiz, you need to input the whole public URL to the images as parameters.
You might want to use makros in the case of many/long URLs. Just look at the source code of the example quiz to see how it works. (Note: This only works if the comment is directly under the headline, and the makros only exist for that page. If you want to reuse them somewhere else, put them into the header comment.)