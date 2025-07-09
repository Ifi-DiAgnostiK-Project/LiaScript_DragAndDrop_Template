<!--
author:   Michael Markert, Niklas Werner
email:    michael.markert@uni-jena.de, niklas.werner@student.tu-freiberg.de
version:  0.2
language: de
narrator: US English Female

script:   https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js

@dragdroporder
<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <div class="choices-container" style="display: flex; flex-direction: column; gap: 10px;">
  </div>

  <div style="margin: 10px; display: flex; flex-direction: row; align-content: center;">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <span style="font-size: 1.5em" class="feedback"></span>
  </div>
</div>

<script>
  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);
        const choicesContainer = quizContainer.querySelector('.choices-container');
        const feedback = quizContainer.querySelector('.feedback');

        const correctAnswers = '@2'.split('|');
        const initialOrder = '@1'.split('|');

        choicesContainer.innerHTML = initialOrder.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');
        
        const sortable = new Sortable(choicesContainer, {
          animation: 150,
        });
        
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');
        checkingButton.addEventListener("click", function (e) {
          const choices = Array.from(choicesContainer.querySelectorAll('.choice'));
          const currentOrder = choices.map(choice => choice.textContent.trim());
          
          const isCorrect = currentOrder.length === correctAnswers.length && 
                            currentOrder.every((answer, index) => answer === correctAnswers[index]);

          if (isCorrect) {
            feedback.textContent = "✅";

            checkingButton.setAttribute("disabled", "");

            choicesContainer.style.borderColor = "rgb(var(--lia-grey))";
            quizContainer.style.borderColor = "rgb(var(--lia-grey))";

            choicesContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
          } else {
            feedback.textContent = "❌";

            const buttonText = checkingButton.textContent.split(" ");
            const count = parseInt(buttonText[1] ?? "0") + 1;
            checkingButton.textContent = "Prüfen " + count.toString();
          }
        })
        
    })();
  }, 100);
</script>
@end

@dragdropmultiple
<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <div style="display: flex; gap: 20px;">
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Auswahl:</div>
      <div class="pool-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed; border-radius: 4px; display: flex; flex-direction: column; gap: 10px;" id="pool-@0">
      </div>
    </div>
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Antwort:</div>
      <div class="target-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed; border-radius: 4px; display: flex; flex-direction: column; gap: 10px;" id="target-@0">
      </div>
    </div>
  </div>
  
  
  <div style="margin: 10px; display: flex; flex-direction: row; align-content: center;">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <span style="font-size: 1.5em" class="feedback"></span>
  </div>
</div>

<script>
  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);

        const poolContainer = quizContainer.querySelector('.pool-container');
        const targetContainer = quizContainer.querySelector('.target-container');
        const feedback = quizContainer.querySelector('.feedback');

        const correctAnswers = new Set('@1'.split('|'));
        const wrongAnswers = '@2'.split('|');
        const allAnswers = [...correctAnswers, ...wrongAnswers];

        //shuffle array
        for (var i = allAnswers.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = allAnswers[i];
            allAnswers[i] = allAnswers[j];
            allAnswers[j] = temp;
        }

        poolContainer.innerHTML = allAnswers.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');
        targetContainer.innerHTML = "";

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

        const checkingButton = quizContainer.querySelector('.lia-quiz__check');
        checkingButton.addEventListener("click", function (e) {
          const currentAnswers = new Set(
            Array.from(targetContainer.querySelectorAll('.choice'))
              .map(choice => choice.textContent.trim())
          );

          const isCorrect = currentAnswers.size === correctAnswers.size &&
                           [...currentAnswers].every(answer => correctAnswers.has(answer));

          if (isCorrect) {
            feedback.textContent = "✅";

            checkingButton.setAttribute("disabled", "");

            const groupSetting = {name: quizId, pull: false, put: false};
            poolSortable.option("group", groupSetting);
            targetSortable.option("group", groupSetting);

            poolContainer.style.borderColor = "rgb(var(--lia-grey))";
            targetContainer.style.borderColor = "rgb(var(--lia-grey))";
            quizContainer.style.borderColor = "rgb(var(--lia-grey))";

            poolContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
            targetContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
          } else {
            feedback.textContent = "❌";

            const buttonText = checkingButton.textContent.split(" ");
            const count = parseInt(buttonText[1] ?? "0") + 1;
            checkingButton.textContent = "Prüfen " + count.toString();
          }
        })
    })();
  }, 100);
</script>
@end

@dragdropmultipleimages
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
  
  <div style="margin: 10px; display: flex; flex-direction: row; align-content: center;">
    <button class="lia-btn  lia-btn--outline lia-quiz__check">Prüfen</button>
    <span style="font-size: 1.5em" class="feedback"></span>
  </div>

</div>

<script>
  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        console.log("@3");
        const quizContainer = document.querySelector(`#quiz-${quizId}`);

        const poolContainer = quizContainer.querySelector('.pool-container');
        const targetContainer = quizContainer.querySelector('.target-container');
        const feedback = quizContainer.querySelector('.feedback');

        const correctAnswers = new Set('@1'.split('|').map((url) => encodeURI(url.replace(" ", ""))));
        const wrongAnswers = '@2'.split('|').map((url) => url.replace(" ", ""));
        const allAnswers = [...correctAnswers, ...wrongAnswers];

        //shuffle array
        for (var i = allAnswers.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = allAnswers[i];
            allAnswers[i] = allAnswers[j];
            allAnswers[j] = temp;
        }

        poolContainer.innerHTML = allAnswers.map(item => 
          `<img src="${item}" class="choice" style="cursor: move; user-select: none; max-width: 100%; max-height: 10rem">`
        ).join('');
        targetContainer.innerHTML = "";

        const poolSortable = new Sortable(poolContainer, {
          group: {
            name: quizId
          },
          animation: 150,
          sort: false
        });
        
        const targetSortable = new Sortable(targetContainer, {
          group: {
            name: quizId
          },
          animation: 150,
          sort: false
        });

        
        const checkingButton = quizContainer.querySelector('.lia-quiz__check');
        checkingButton.addEventListener("click", function (e) {
          const currentAnswers = new Set(
            Array.from(targetContainer.querySelectorAll('.choice'))
              .map(choice => choice.src)
          );

          const isCorrect = currentAnswers.size === correctAnswers.size &&
                           [...currentAnswers].every(answer => correctAnswers.has(answer));

          if (isCorrect) {
            feedback.textContent = "✅";

            checkingButton.setAttribute("disabled", "");

            const groupSetting = {name: quizId, pull: false, put: false};
            poolSortable.option("group", groupSetting);
            targetSortable.option("group", groupSetting);

            poolContainer.style.borderColor = "rgb(var(--lia-grey))";
            targetContainer.style.borderColor = "rgb(var(--lia-grey))";
            quizContainer.style.borderColor = "rgb(var(--lia-grey))";

            poolContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
            targetContainer.querySelectorAll("*").forEach((element) => element.style.cursor = "default");
          } else {
            feedback.textContent = "❌";

            const buttonText = checkingButton.textContent.split(" ");
            const count = parseInt(buttonText[1] ?? "0") + 1;
            checkingButton.textContent = "Prüfen " + count.toString();
          }
        })
    })();
  }, 100);
</script>
@end
-->

# Drag and Drop Quizzes

This is a fork of Michael Markerts drag and drop quiz template which also allows has a mode for images.

* See the Github version of this document [here...](https://github.com/wenik35/LiaScript_DragAndDrop_Template/)
* See the LiaScript version of this document [here...](https://liascript.github.io/course/?https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md)

To use these macros within your document, simply import it into LiaScript via:

`import: https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md`

## Drag and drop order quiz

Try to order these items correctly by dragging and dropping them!

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

@dragdropmultipleimages(@uid, @mustang|@f18, @chevrolet|@ford)

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
You might want to use makros in the case of many/long URLs. Just look at the source code of the example quiz to see how it works.