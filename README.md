<!--
author:   Michael Markert
email:    michael.markert@uni-jena.de
version:  0.1
language: de
narrator: US English Female

script:   https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js

@dragdroporder
<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;">
  <div class="choices-container" style="display: flex; flex-direction: column; gap: 10px;" id="quiz-@0">
  </div>
  <div class="feedback" style="margin-top: 20px; font-size:2em; font-weight: bold; text-align: center;">🤔</div>
</div>

<script>
  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const container = document.querySelector(`#quiz-${quizId}`);

        const feedback = container.nextElementSibling;
        const correctAnswers = '@2'.split('|');

        const initialOrder = '@1'.split('|');
        container.innerHTML = initialOrder.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');
        
        new Sortable(container, {
          animation: 150,
          onEnd: function() {
            const choices = Array.from(container.querySelectorAll('.choice'));
            const currentOrder = choices.map(choice => choice.textContent.trim());
            
            const isCorrect = currentOrder.length === correctAnswers.length && 
                             currentOrder.every((answer, index) => answer === correctAnswers[index]);
            
            if (isCorrect) {
              feedback.textContent = "✅";
            } else {
              feedback.textContent = "❌";
            }
          }
        });
        
    })();
  }, 100);
</script>
@end

@dragdropmultiple
<div style="width: 100%; max-width: 600px; padding: 20px; border: 1px solid rgb(var(--color-highlight)); border-radius: 8px;" id="quiz-@0">
  <div style="display: flex; gap: 20px;">
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Pool:</div>
      <div class="pool-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed; border-radius: 4px; display: flex; flex-direction: column; gap: 10px;" id="pool-@0">
      </div>
    </div>
    <div style="flex: 1;">
      <div style="font-weight: bold; margin-bottom: 10px;">Your Selection:</div>
      <div class="target-container lia-code lia-code--inline" style="min-height: 50px; padding: 10px; border: 1px dashed border-radius: 4px; display: flex; flex-direction: column; gap: 10px;" id="target-@0">
      </div>
    </div>
  </div>
  
  <div class="feedback" style="margin-top: 20px; font-size: 2em; font-weight: bold; text-align: center;">🤔</div>
</div>

<script>
  void setTimeout(() => {
    (function(){
        const quizId = '@0';
        const quizContainer = document.querySelector(`#quiz-${quizId}`);

        const poolContainer = quizContainer.querySelector('.pool-container');
        const targetContainer = quizContainer.querySelector('.target-container');
        const feedback = quizContainer.querySelector('.feedback');
        const correctAnswers = new Set('@2'.split('|'));

        const initialOrder = '@1'.split('|');
        poolContainer.innerHTML = initialOrder.map(item => 
          `<div class="choice lia-code lia-code--inline" style="padding: 10px; border-radius: 4px; cursor: move; user-select: none;">${item}</div>`
        ).join('');

        new Sortable(poolContainer, {
          group: {
            name: quizId,
            put: true
          },
          animation: 150,
          onEnd: checkAnswer
        });
        
        new Sortable(targetContainer, {
          group: {
            name: quizId,
            pull: true,
            put: true
          },
          animation: 150,
          onAdd: checkAnswer,
          onRemove: checkAnswer
        });

        function checkAnswer() {
          const currentAnswers = new Set(
            Array.from(targetContainer.querySelectorAll('.choice'))
              .map(choice => choice.textContent.trim())
          );

          const isCorrect = currentAnswers.size === correctAnswers.size &&
                           [...currentAnswers].every(answer => correctAnswers.has(answer));
          
          if (isCorrect) {
            feedback.textContent = "✅";
          } else {
            feedback.textContent = "❌";
          }
        }
    })();
  }, 100);
</script>
@end
-->

# Drag and Drop Quizzes

This is a template for JS-based drag and drop quizzes in LiaScript documents.

* See the Github version of this document [here...](https://github.com/MichaelMarkert/LiaScript_DragAndDrop_Template/)
* See the LiaScript version of this document [here...](https://liascript.github.io/course/?https://raw.githubusercontent.com/MichaelMarkert/LiaScript_DragAndDrop_Template/refs/heads/main/README.md)

To use these macros within your document, simply import it into LiaScript via:

`import: https://raw.githubusercontent.com/MichaelMarkert/LiaScript_DragAndDrop_Template/refs/heads/main/README.md`

## Drag and drop order quiz

Try to order these items correctly by dragging and dropping them!

@dragdroporder(@uid,4|2|3|1,1|2|3|4)

Try to order these items correctly by dragging and dropping them (hint: should be a sentence)!

@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)

## Drag and drop multiple choice quiz

Select the correct numbers from the pool (hint: odd numbers only)!

@dragdropmultiple(@uid,1|2|3|4|5|6,1|3|5)

Select the correct numbers from the pool (hint: even numbers only)!

@dragdropmultiple(@uid,1|2|3|4|5|6,2|4|6)

## How to use it in your LiaScript

Just put 

`@dragdroporder(@uid,4|2|3|1,1|2|3|4)`

, or 

`@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)`

, where

* `@uid` generates an id for the quiz which is important for correct implementation
* parameter after `@uid` is the initial order of elements (separated by `|`), and the
* second parameter is the correct order of elements (separated by `|`)

I tried to avoid having `@uid`in the script by nesting in the header (`@dragdroporder: @dragdroporder_(@uid,@0)`) but then the second parameter is not written correctly which breaks the quiz. 