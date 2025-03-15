
import { triggerReusableImageAnimation, animateSentenceCompletion, disappearBox, appearBox, animateWrongWord } from "./animations.js";
import { requestFullScreen } from "./utils.js";


// Game Observer


export class GameObserver {
    constructor(gameState) {
        this.gameState = gameState;
        this.gameContainer = document.getElementById("gameContainer");
        this.endScreen = document.getElementById("endScreen");
        // Rows containers
        this.topContainer = document.getElementById("topRow");
        this.bottomContainer = document.getElementById("bottomRow");
        this.sentenceIndicator = document.getElementById("sentenceIndicator");
    }


    // This method is called when the GameState changes
    async update(eventType, payload) {
        switch (eventType) {

            case "animation":

                Array.from(this.topContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });
                Array.from(this.bottomContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });

                if (payload.wordIndex !== undefined) {
                    // if payload includes 'wordIndex' it means we want the box in the bottom row to disappear
                    const disappearingBox = this.bottomContainer.children[payload.wordIndex];
                    await this.gameState.notifyListeners('correct');
                    await disappearBox(disappearingBox);

                }
                if (payload.nextEmptyIndex !== undefined) {
                    // if payload includes 'nextEmptyIndex' it means we want the box in the top row to appear
                    const appearingBox = this.topContainer.children[payload.nextEmptyIndex];
                    await triggerReusableImageAnimation(appearingBox, 'tick');
                    await appearBox(appearingBox);


                }
                if (payload.isCompleted) {
                    await this.gameState.notifyListeners('sentenceCompleted');
                    await animateSentenceCompletion(this.topContainer);
                }

                break;

            case "stateChanged":
                // as topContainer and bottomContainer are re-rendered in renderSentence() everytime
                // this event is observed, there is no need to remove the class .not-clickable
                // at a later time
                Array.from(this.topContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });
                Array.from(this.bottomContainer.children).forEach((box) => {
                    box.classList.add('not-clickable')
                });

                // Handling animations before re-rendering word
                let currentSentenceIndex = payload.currentSentenceIndex;
                const { gameWon } = payload;

                console.log("gameWon", gameWon)


                if (gameWon) {
                    this.toggleScreens(payload.sentences);
                    return
                };
                // Re-render word
                this.renderSentence(currentSentenceIndex);
                console.log("Called renderSentence");

                break;

            case "triggerRendering":
                // Re-render word
                this.renderSentence(payload.currentSentenceIndex);
                console.log("Called renderWord");
                break;

            case "enterFullScreen":
                requestFullScreen();
                break;

            case "wrongLetter":
                await this.gameState.notifyListeners('incorrect');
                await animateWrongWord(this.bottomContainer, payload.wordIndex);
                break;
        }

        return
    }

    // if word is made up only by one character, returns true
    isMadeOfOnlyChar(word, char) {
        return word.replaceAll(char, "").trim() === "";
    }


    checkFullscreen() {
        const overlay = document.getElementById('overlay');
        if (document.fullscreenElement) {
            overlay.classList.add('hidden');
        } else {
            overlay.classList.remove('hidden');
        }
    }


    // Re-rendering

    toggleScreens(words) {
        this.gameContainer.classList.add("hidden");
        this.endScreen.classList.remove("hidden");
        this.renderEndScreen(words);
    }

    renderEndScreen(sentences) {
        sentences.forEach((sentence, sentenceIndex) => {
            // Create a row for the sentence
            const row = document.createElement("div");
            row.classList.add("row");
            row.id = `topRow`; // Assign a unique ID for each row

            // Populate the row with letters
            sentence.split(" ").forEach(letter => {
                const box = document.createElement("div");
                box.classList.add("box", "normal", "correct"); // Add classes
                box.textContent = letter; // Set the letter
                row.appendChild(box); // Add the box to the row
            });

            // Append the row to the container
            this.endScreen.appendChild(row);
        });
    }

    // Render both the top and bottom rows
    renderSentence(currentSentenceIndex) {
        const sentence = this.gameState.state.sentences[currentSentenceIndex];
        console.log(sentence)
        this.renderRow(this.topContainer, { topRow: sentence.topRow });
        this.renderRow(this.bottomContainer, { bottomRow: sentence.bottomRow });
        this.sentenceIndicator.textContent = `Sentence ${currentSentenceIndex + 1} of ${this.gameState.state.sentences.length}`;
    }

    // Render a single row (top or bottom)
    renderRow(container, rowData) {
        container.innerHTML = ""; // Clear current content
        const currentSentence = this.gameState.state.sentences[this.gameState.state.currentSentenceIndex].sentence;
        // Top row
        if (rowData.topRow) {
            rowData.topRow.forEach((word, index) => {
                const box = document.createElement("div");

                word == "" ?
                    box.classList.add('box', 'underscored') :
                    box.classList.add('box', 'normal', 'correct')
                box.textContent = word;
                console.log(currentSentence.split(" ")[index])
                box.style.width = `${(currentSentence.split(" ")[index].length) + 2}rem`; // Dynamically set width based on word length
                container.appendChild(box);
            });
        };
        // Bottom row
        if (rowData.bottomRow) {
            rowData.bottomRow.forEach(word => {
                const box = document.createElement("div");
                // conditional rendering 
                if (this.isMadeOfOnlyChar(word, "^")) {
                    box.classList.add("box", "hidden");
                } else {
                    box.classList.add("box", "normal");
                }
                box.style.width = `${(word.length) + 2}rem`; // Dynamically set width based on word length
                box.textContent = word;
                container.appendChild(box);
            });
        }

    }


}