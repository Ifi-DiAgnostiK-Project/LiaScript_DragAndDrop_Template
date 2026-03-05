# Drag and Drop Quizzes
<!--
@img: https://raw.githubusercontent.com/wenik35/LiaScript_ImageQuiz/main/img/mustang.jpg
-->

This is a fork of Michael Markerts drag and drop quiz template which also allows has a mode for images.

* See the Github version of this document [here...](https://github.com/wenik35/LiaScript_DragAndDrop_Template/)
* See the LiaScript version of this document [here...](https://liascript.github.io/course/?https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md)
* Developer guide (build, test, extend): [docs/development.md](docs/development.md)

To use these macros within your document, simply import it into LiaScript via:

`import: https://raw.githubusercontent.com/wenik35/LiaScript_DragAndDrop_Template/refs/heads/main/README.md`

## Order quiz

Try to order these items correctly by dragging and dropping them!

<!-- data-randomize -->
@dragdroporder(@uid,4|2|3|1,1|2|3|4)

Try to order these items correctly by dragging and dropping them (hint: should be a sentence)!

@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)

### How to use

The signature for the order quizzes is 

`@dragdroporder(@uid,<initial>,<correct>)`,

, where

* `@uid` generates an id for the quiz which is important for correct implementation,
* `<initial>` is the initial order of elements (separated by `|`),
* `<correct>` is the correct order of elements (separated by `|`).

Example: `@dragdroporder(@uid,solution|is|this|the,this|is|the|solution)`


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

`@dragdropmultiple(@uid,<correct>,<wrong>)`,

, where

* `@uid` works the same as in the order quiz,
* `<correct>` are the correct answers (separated by `|`),
* `<wrong>` are the correct answers (again separated by `|`).

Example: `@dragdropmultiple(@uid,1|3|5,2|4|6)`

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

`@dragdropsort(@uid,<answers>,<prefill>)`,

, where

* `@uid` works the same as in the order quiz,
* `<pairs>` are the pairs (again separated by `|`), consisting of the target and at least one affiliated answer (separated by `;`), and
* `<prefill>` (optional) is a positive integer — if provided, that many answers are pre-placed into their correct targets to give students a head start.

Example: `@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object)`
The target is always the first one in the pair-list.

Example with pre-fill: `@dragdropsort(@uid,@f18;Plane;Jet|Green;Color|Table;Object,2)` pre-places the first correct answer for each of the first 2 targets.

After a wrong check, correctly placed items are highlighted in green and incorrectly placed (or unplaced) items are highlighted in red.

Using images for the answers works the same as in the multiple choice quiz, but targets can be a mix of images and text.
